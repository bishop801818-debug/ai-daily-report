"""
飞书 OAuth 云函数 - Vercel Python 运行时
用于处理飞书授权回调，获取用户部门信息（支持部门树细粒度）

改动（2026-07-08）：
- 新增 get_dept_ancestors()：对每个直接部门向上遍历 parent_department_id，
  收集其全部祖先部门 ID，使"授权某父部门即自动覆盖其所有下级部门"。
- 返回字段新增 dept_ids（直接部门 + 祖先部门，去重），供前端按部门树做子树匹配；
  保留 matched_bu / matched_dept_name 以兼容既有 BU 级逻辑。
"""

import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

# ============ 配置区域 ============
FEISHU_APP_ID = os.environ.get('FEISHU_APP_ID', 'cli_aab2066784b85bcf')
FEISHU_APP_SECRET = os.environ.get('FEISHU_APP_SECRET', '')
FEISHU_REDIRECT_URI = os.environ.get('FEISHU_REDIRECT_URI', '')

# 部门 → 事业部映射（BU ID 必须与各 HTML 页面中的 BU_NAME_MAP 一致）
# 每个 BU 的 value 是列表，支持多个部门名变体（精确匹配 + 模糊匹配备用）
DEPT_TO_BU = {
    'sdmd': ['山东美多', '美多', '山东美多新能源'],
    'lpsd': ['锂源研究院', '锂源', '常州锂源研究院', '龙蟠时代'],
    'czly': ['常州锂源', '锂源事业部', '常州锂源新能源'],
    'felt': ['法恩莱特', '法恩莱特新能源', '电解液', '莱特'],
    'sjld': ['三金锂电', '三金', '江苏三金'],
    'kls': ['可兰素', '可兰素环保', '车用尿素'],
    'lhy': ['润滑油事业部', '润滑油', '龙蟠润滑油', 'lube', 'lubricant'],
    'dhx': ['迪克化学', '迪克', '江苏迪克', 'dkhx', 'dick'],
    'bych': ['铂源氢能', '铂源', '氢能', '催化剂'],
}

# 反向映射：部门名 → BU ID（自动生成，用于快速查找）
_DEPT_TO_BU_FLAT = {}
for _bu_id, _names in DEPT_TO_BU.items():
    for _name in _names:
        _DEPT_TO_BU_FLAT[_name] = _bu_id

# 正确的 BU ID 集合（用于校验）
VALID_BU_IDS = set(DEPT_TO_BU.keys())


def _http_json(method, url, json_body=None, headers=None, timeout=10):
    """用标准库 urllib 发起 HTTP 请求并返回解析后的 JSON（零外部依赖）。

    兼容飞书接口返回的 JSON；HTTP 错误也尽量解析错误体。
    """
    data = None
    hdrs = dict(headers or {})
    if json_body is not None:
        data = json.dumps(json_body).encode('utf-8')
        hdrs.setdefault('Content-Type', 'application/json')
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode('utf-8'))
        except Exception:
            raise Exception(f"HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise Exception(f"网络错误: {e.reason}")


def get_feishu_access_token(app_id, app_secret):
    """获取飞书 access_token"""
    url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'
    result = _http_json('POST', url, {'app_id': app_id, 'app_secret': app_secret})
    if result.get('code') == 0:
        return result['tenant_access_token']
    else:
        raise Exception(f"获取 access_token 失败: {result}")


def get_user_dept(user_id, access_token):
    """获取用户部门（直接所属部门 ID 列表）"""
    url = f'https://open.feishu.cn/open-apis/contact/v3/users/{user_id}/department_ids'
    headers = {'Authorization': f'Bearer {access_token}'}
    result = _http_json('GET', url, headers=headers)

    if result.get('code') == 0:
        dept_ids = result.get('data', {}).get('department_ids', [])
        return dept_ids
    else:
        raise Exception(f"获取用户部门失败: {result}")


def get_dept_ancestors(dept_id, access_token, max_depth=20):
    """返回 dept_id 的全部祖先部门 ID（含自身），用于部门树子树匹配。

    遍历 parent_department_id 直到根部门（parent 为 '0' 或自身）。
    返回的列表即用户"可见的部门范围"：若某策略授权了父部门，
    则其所有下级部门用户都会包含该父部门 ID → 命中。
    """
    ancestors = []
    cur = dept_id
    for _ in range(max_depth):
        if not cur or cur == '0':
            break
        if cur in ancestors:
            break
        ancestors.append(cur)
        try:
            url = f'https://open.feishu.cn/open-apis/contact/v3/departments/{cur}'
            result = _http_json('GET', url, headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
            if result.get('code') != 0:
                break
            parent = result.get('data', {}).get('department', {}).get('parent_department_id')
            if not parent or parent == cur:
                break
            cur = parent
        except Exception:
            break
    return ancestors


def get_dept_name(dept_id, access_token):
    """获取单个部门名称"""
    try:
        url = f'https://open.feishu.cn/open-apis/contact/v3/departments/{dept_id}'
        result = _http_json('GET', url, headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
        if result.get('code') == 0:
            return result.get('data', {}).get('department', {}).get('name', '')
    except Exception:
        pass
    return ''


def match_bu(dept_ids, access_token):
    """根据部门 ID 匹配事业部（精确匹配 + 模糊匹配兜底）"""
    # 先收集所有部门名（含祖先）
    dept_names = []
    for dept_id in dept_ids:
        dn = get_dept_name(dept_id, access_token)
        if dn:
            dept_names.append(dn)

    # 精确匹配：dept_name 是否在 _DEPT_TO_BU_FLAT 的 key 里
    for dn in dept_names:
        if dn in _DEPT_TO_BU_FLAT:
            return _DEPT_TO_BU_FLAT[dn], dn

    # 模糊匹配兜底：dept_name 包含某个关键词
    fuzzy_rules = [
        (['美多', 'sdmd'], 'sdmd'),
        (['锂源', 'lpsd', '龙蟠时代'], 'lpsd'),
        (['常州锂源', 'czly'], 'czly'),
        (['法恩莱特', 'felt', '电解液', '莱特'], 'felt'),
        (['三金', 'sjld', '锂电'], 'sjld'),
        (['可兰素', 'kls', '尿素'], 'kls'),
        (['润滑油', 'lhy', 'lube', 'lubricant'], 'lhy'),
        (['迪克', 'dhx', 'dkhx', 'dick'], 'dhx'),
        (['铂源', 'bych', '氢能', '催化剂'], 'bych'),
    ]
    for dn in dept_names:
        for keywords, bu_id in fuzzy_rules:
            if any(kw in dn for kw in keywords):
                return bu_id, dn

    # 都匹配失败，记录警告
    print(f"⚠️  警告：无法匹配事业部，部门名: {dept_names}")
    return None, None


class handler(BaseHTTPRequestHandler):
    def _send_json(self, code, payload):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def do_POST(self):
        # 兼容两种路径：原始 /feishu/callback（Vercel 透传）或
        # Vercel rewrite 后的 /api/feishu.py（dest 改写）
        parsed = urlparse(self.path)
        clean = parsed.path
        if not (clean == '/feishu/callback' or clean == '/api/feishu.py' or clean.endswith('/api/feishu.py')):
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length else b'{}'
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            data = {}

        code = data.get('code')
        if not code:
            self._send_json(400, {'code': -1, 'msg': '缺少 code 参数'})
            return

        try:
            # 1. 用 code 交换 access_token 和 user_id
            token_url = 'https://open.feishu.cn/open-apis/authen/v1/access_token'
            token_data = {
                'app_id': FEISHU_APP_ID,
                'app_secret': FEISHU_APP_SECRET,
                'code': code,
                'grant_type': 'authorization_code'
            }
            token_result = _http_json('POST', token_url, token_data)

            if token_result.get('code') != 0:
                raise Exception(f"交换 token 失败: {token_result}")

            access_token = token_result['data']['access_token']
            user_id = token_result['data']['user_id']

            # 2. 获取用户直接部门
            direct_dept_ids = get_user_dept(user_id, access_token)

            # 3. 部门树展开：收集每个直接部门的全部祖先 → 子树匹配能力
            all_dept_ids = []
            for d in direct_dept_ids:
                for anc in get_dept_ancestors(d, access_token):
                    if anc not in all_dept_ids:
                        all_dept_ids.append(anc)

            # 4. 匹配事业部
            matched_bu, matched_dept_name = match_bu(all_dept_ids, access_token)

            # 5. 返回结果（dept_ids 含祖先，供前端按部门树匹配）
            self._send_json(200, {
                'code': 0,
                'data': {
                    'user_id': user_id,
                    'matched_bu': matched_bu or 'all',
                    'matched_dept_name': matched_dept_name or '未匹配',
                    'dept_ids': all_dept_ids,
                    'direct_dept_ids': direct_dept_ids
                }
            })
        except Exception as e:
            self._send_json(500, {'code': -1, 'msg': str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # 抑制默认访问日志噪音
    def log_message(self, format, *args):
        return
