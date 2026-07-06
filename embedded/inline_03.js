
// 页面加载后立即更新时钟和日期
document.addEventListener('DOMContentLoaded', function() {
var updateClock = function() {
var now = new Date();
// 日期格式：2026年5月17日 星期六
var dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
var dateStr = now.toLocaleDateString('zh-CN', dateOptions);
// 时间格式：HH:MM:SS（24小时制，精确到秒）
var timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

var dateEl = document.getElementById('currentDate');
var timeEl = document.getElementById('realTimeClock');
var iconEl = document.getElementById('clockIcon');

if(dateEl) dateEl.textContent = dateStr;
if(timeEl) timeEl.textContent = timeStr;

if(iconEl) {
var hour = now.getHours();
if(hour >= 6 && hour < 12) iconEl.textContent = '🌅';
else if(hour >= 12 && hour < 18) iconEl.textContent = '☀️';
else if(hour >= 18 && hour < 22) iconEl.textContent = '🌆';
else iconEl.textContent = '🌙';
}
};
// 立即执行
updateClock();
// 每秒更新
setInterval(updateClock, 1000);

// 导航栏滑动指示器
(function initMainNavPill() {
var menu = document.getElementById('mainNavMenu');
var pill = document.getElementById('mainNavPill');
if (!menu || !pill) return;
var items = menu.querySelectorAll('.main-nav-item');
function movePill(el) {
if (!el) { pill.style.opacity = '0'; return; }
pill.style.opacity = '1';
pill.style.left = (el.offsetLeft - 1) + 'px';
pill.style.width = (el.offsetWidth + 2) + 'px';
}
items.forEach(function(item) {
item.addEventListener('mouseenter', function() {
movePill(item);
items.forEach(function(i) { i.classList.remove('active'); });
item.classList.add('active');
});
});
menu.addEventListener('mouseleave', function() {
pill.style.opacity = '0';
items.forEach(function(i) { i.classList.remove('active'); });
});
// 默认选中第一个
if (items[0]) movePill(items[0]);
})();
});
