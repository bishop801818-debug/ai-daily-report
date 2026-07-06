function generateLocalInsights(data) {
    if (!data) return { insights: [] };
    
    var insights = [];
    var month = data.month;
    var dims = data.dims;
    var totalScore = data.totalScore;
    var history = data.history || [];
    var diagnostic = data.diagnostic || null;
    var kpiComparison = data.kpiComparison || null;
    var dimComparisons = data.dimComparisons || {};
    
    var dimNames = ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'];
    
    // ══分析1：综合表现诊断（总分+趋势+原因分析）═
    if (history.length > 0) {
        var prevData = history[history.length - 1];
        var prevScore = Math.round(Object.values(prevData.dims).reduce(function(a, b) { return a + b; }, 0) / 6);
        var scoreChange = totalScore - prevScore;
        var changePercent = prevScore > 0 ? ((scoreChange / prevScore) * 100).toFixed(1) : 0;
        
        // 分析变化原因：哪些维度改善/下滑
        var improving = [];
        var declining = [];
        ['d1','d2','d3','d4','d5','d6'].forEach(function(dimId, idx) {
            var diff = dims[dimId] - prevData.dims[dimId];
            if (diff > 3) improving.push(dimNames[idx] + '(+' + diff + ')');
            if (diff < -3) declining.push(dimNames[idx] + '(' + diff + ')');
        });
        
        var reason = '';
        if (improving.length > 0) reason = '主要改善：' + improving.join('、');
        if (declining.length > 0) reason += (reason ? '；' : '') + '主要下滑：' + declining.join('、');
        
        if (scoreChange > 3) {
            insights.push({
                type: 'positive',
                icon: '📈',
                title: '综合表现改善',
                text: month + '月综合评分' + totalScore + '分，较上月(' + prevScore + '分)上升' + scoreChange + '分(+' + changePercent + '%)，整体经营向好。' + reason,
                meta: '评分+' + scoreChange + '分'
            });
        } else if (scoreChange < -3) {
            insights.push({
                type: 'negative',
                icon: '📉',
                title: '综合表现下滑',
                text: month + '月综合评分' + totalScore + '分，较上月(' + prevScore + '分)下降' + Math.abs(scoreChange) + '分(' + changePercent + '%)，需重点关注。' + reason,
                meta: '评分' + scoreChange + '分'
            });
        } else {
            insights.push({
                type: 'neutral',
                icon: '➡️',
                title: '综合表现稳定',
                text: month + '月综合评分' + totalScore + '分，与上月(' + prevScore + '分)基本持平(±' + Math.abs(scoreChange) + '分)，表现稳定。' + reason,
                meta: '评分±' + Math.abs(scoreChange) + '分'
            });
        }
    } else {
        insights.push({
            type: 'neutral',
            icon: '📊',
            title: '本月综合评分',
            text: month + '月综合评分' + totalScore + '分（六维平均分），当前为首个数据月份，暂无历史对比。',
            meta: '综合' + totalScore + '分'
        });
    }
    
    // ══分析2：计划完成度诊断（预算vs目标vs实际，详细分析）═
    if (kpiComparison && kpiComparison.items) {
        var items = kpiComparison.items;
        var budgetMatch = 0;
        var targetMatch = 0;
        var underBudgetItems = [];
        var overTargetItems = [];
        
        items.forEach(function(kpi) {
            if (kpi.actual >= kpi.budget) budgetMatch++;
            if (kpi.actual >= kpi.target) targetMatch++;
            if (kpi.actual < kpi.budget) underBudgetItems.push(kpi.name + '(' + kpi.actual + '/' + kpi.budget + kpi.unit + ')');
            if (kpi.actual >= kpi.target) overTargetItems.push(kpi.name + '(' + kpi.actual + '/' + kpi.target + kpi.unit + ')');
        });
        
        var budgetRate = Math.round((budgetMatch / items.length) * 100);
        var targetRate = Math.round((targetMatch / items.length) * 100);
        
        var detailText = '预算达成' + budgetMatch + '/' + items.length + '项(' + budgetRate + '%)';
        if (underBudgetItems.length > 0) detailText += '；未达预算：' + underBudgetItems.slice(0, 2).join('、');
        if (overTargetItems.length > 0) detailText += '；超目标：' + overTargetItems.slice(0, 2).join('、');
        
        if (targetRate >= 80) {
            insights.push({
                type: 'positive',
                icon: '🎯',
                title: '计划完成度优秀',
                text: '核心KPI挑战目标达成率' + targetRate + '%，预算达成率' + budgetRate + '%，整体计划执行出色。' + detailText,
                meta: '目标达成' + targetRate + '%'
            });
        } else if (budgetRate >= 80) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: '计划完成度一般',
                text: '核心KPI预算达成率' + budgetRate + '%，但挑战目标达成率仅' + targetRate + '%，部分指标未达预期。' + detailText,
                meta: '预算达成' + budgetRate + '%'
            });
        } else {
            insights.push({
                type: 'negative',
                icon: '🚨',
                title: '计划完成度堪忧',
                text: '核心KPI预算达成率仅' + budgetRate + '%，挑战目标达成率' + targetRate + '%，多项指标未达预算需紧急复盘。' + detailText,
                meta: '预算达成' + budgetRate + '%'
            });
        }
    }
    
    // ══分析3：六维深度分析（最强/最弱维度+原因分析）═
    var dimScores = [dims.d1, dims.d2, dims.d3, dims.d4, dims.d5, dims.d6];
    var maxScore = Math.max.apply(null, dimScores);
    var minScore = Math.min.apply(null, dimScores);
    var maxIndex = dimScores.indexOf(maxScore);
    var minIndex = dimScores.indexOf(minScore);
    
    // 最强维度分析
    if (maxScore >= 90) {
        var strengthReason = '';
        if (diagnostic && diagnostic['d' + (maxIndex+1)] && diagnostic['d' + (maxIndex+1)].positives) {
            strengthReason = diagnostic['d' + (maxIndex+1)].positives[0] || '';
        }
        insights.push({
            type: 'positive',
            icon: '💪',
            title: '最强维度：' + dimNames[maxIndex],
            text: dimNames[maxIndex] + '维度得分' + maxScore + '分，表现优秀，是本月核心亮点。' + strengthReason.substring(0, 60),
            meta: dimNames[maxIndex] + ' ' + maxScore + '分'
        });
    }
    
    // 最弱维度分析
    if (minScore < 85) {
        var weaknessReason = '';
        var weaknessIssue = '';
        if (diagnostic && diagnostic['d' + (minIndex+1)]) {
            if (diagnostic['d' + (minIndex+1)].issues && diagnostic['d' + (minIndex+1)].issues.length > 0) {
                weaknessIssue = diagnostic['d' + (minIndex+1)].issues[0];
            }
            if (diagnostic['d' + (minIndex+1)].findings && diagnostic['d' + (minIndex+1)].findings.length > 0) {
                weaknessReason = diagnostic['d' + (minIndex+1)].findings[0];
            }
        }
        insights.push({
            type: 'negative',
            icon: '🔍',
            title: '最弱维度：' + dimNames[minIndex],
            text: dimNames[minIndex] + '维度得分' + minScore + '分（六维最低）。问题：' + (weaknessIssue || weaknessReason).substring(0, 60),
            meta: dimNames[minIndex] + ' ' + minScore + '分'
        });
    }
    
    // ══分析4：月度环比-各维度变化分析（找出改善/下滑原因）═
    if (history.length > 0) {
        var prevData = history[history.length - 1];
        var improvingDims = [];
        var decliningDims = [];
        var stableDims = [];
        
        ['d1','d2','d3','d4','d5','d6'].forEach(function(dimId, idx) {
            var currentVal = dims[dimId];
            var prevVal = prevData.dims[dimId];
            if (!prevVal || prevVal === 0) { stableDims.push(dimNames[idx]); return; }
            
            var change = currentVal - prevVal;
            var changePct = prevVal > 0 ? ((change / prevVal) * 100).toFixed(1) : 0;
            if (change > 5) {
                improvingDims.push(dimNames[idx] + '(+' + change + '/' + changePct + '%)');
            } else if (change < -5) {
                decliningDims.push(dimNames[idx] + '(' + change + '/' + changePct + '%)');
            } else {
                stableDims.push(dimNames[idx]);
            }
        });
        
        if (improvingDims.length > 0) {
            insights.push({
                type: 'positive',
                icon: '📊',
                title: '维度改善（' + improvingDims.length + '项）',
                text: '与上月相比，' + improvingDims.join('、') + '维度得分明显提升，改进措施见效，建议总结成功经验。',
                meta: improvingDims.length + '个改善'
            });
        }
        
        if (decliningDims.length > 0) {
            insights.push({
                type: 'negative',
                icon: '📉',
                title: '维度下滑（' + decliningDims.length + '项）',
                text: '与上月相比，' + decliningDims.join('、') + '维度得分明显下降，需分析下滑原因并制定改进计划。',
                meta: decliningDims.length + '个下滑'
            });
        }
        
        if (stableDims.length > 0 && improvingDims.length === 0 && decliningDims.length === 0) {
            insights.push({
                type: 'neutral',
                icon: '➡️',
                title: '维度稳定',
                text: '与上月相比，六维得分基本稳定（变化±5分内），' + stableDims.join('、') + '维度无明显波动。',
                meta: '全部稳定'
            });
        }
    }
    
    // ══分析5：问题预警（从诊断数据提取，按严重程度排序）═
    if (diagnostic) {
        var allIssues = [];
        ['d1','d2','d3','d4','d5','d6'].forEach(function(dimId) {
            if (diagnostic[dimId] && diagnostic[dimId].issues) {
                diagnostic[dimId].issues.forEach(function(issue) {
                    allIssues.push({ dim: dimId.toUpperCase(), issue: issue });
                });
            }
        });
        
        if (allIssues.length > 0) {
            var topIssues = allIssues.slice(0, 3).map(function(item) {
                return '【' + item.dim + '】' + item.issue.substring(0, 30) + '...';
            });
            insights.push({
                type: 'warning',
                icon: '🚨',
                title: '问题预警（' + allIssues.length + '项）',
                text: '诊断发现' + allIssues.length + '项问题，重点关注：' + topIssues.join('；') + '。建议制定整改计划并跟踪闭环。',
                meta: allIssues.length + '项问题'
            });
        }
    }
    
    // ══分析6：积极进展（从诊断数据提取，提炼亮点）═
    if (diagnostic) {
        var allPositives = [];
        ['d1','d2','d3','d4','d5','d6'].forEach(function(dimId) {
            if (diagnostic[dimId] && diagnostic[dimId].positives) {
                diagnostic[dimId].positives.forEach(function(pos) {
                    allPositives.push({ dim: dimId.toUpperCase(), text: pos });
                });
            }
        });
        
        if (allPositives.length > 0) {
            var topPositives = allPositives.slice(0, 2).map(function(item) {
                return '【' + item.dim + '】' + item.text.substring(0, 25) + '...';
            });
            insights.push({
                type: 'positive',
                icon: '✨',
                title: '积极进展（' + allPositives.length + '项）',
                text: '本月取得' + allPositives.length + '项积极进展，包括：' + topPositives.join('；') + '等。建议巩固优势并扩大成果。',
                meta: allPositives.length + '项进展'
            });
        }
    }
    
    // ══分析7：KPI达标分析（详细分析哪些KPI未达预算/目标）═
    if (kpiComparison && kpiComparison.items) {
        var underBudget = kpiComparison.items.filter(function(kpi) { return kpi.actual < kpi.budget; });
        var underTarget = kpiComparison.items.filter(function(kpi) { return kpi.actual < kpi.target && kpi.actual >= kpi.budget; });
        var overTarget = kpiComparison.items.filter(function(kpi) { return kpi.actual >= kpi.target; });
        
        if (underBudget.length > 0) {
            var underBudgetNames = underBudget.map(function(kpi) { 
                return kpi.name + '(' + kpi.actual + '/' + kpi.budget + kpi.unit + ')'; 
            });
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'KPI未达预算（' + underBudget.length + '项）',
                text: '以下KPI未达预算：' + underBudgetNames.join('、') + '。需分析差距原因并制定追赶计划，必要时调整目标或策略。',
                meta: underBudget.length + '项未达预算'
            });
        }
        
        if (overTarget.length > 0 && underBudget.length === 0) {
            insights.push({
                type: 'positive',
                icon: '✅',
                title: 'KPI全面达预算',
                text: '所有核心KPI均达预算，其中' + overTarget.length + '项达挑战目标（' + overTarget.map(function(kpi) { return kpi.name; }).join('、') + '），执行力强。',
                meta: '全面达预算'
            });
        }
    }
    
    // ══分析8：改进建议（基于问题推导具体行动项）═
    if (diagnostic) {
        var actionItems = [];
        
        // 从最弱维度的issues推导改进建议
        ['d1','d2','d3','d4','d5','d6'].forEach(function(dimId) {
            if (diagnostic[dimId] && diagnostic[dimId].issues && dims[dimId] < 85) {
                diagnostic[dimId].issues.forEach(function(issue) {
                    if (issue.length > 10) {
                        actionItems.push('【' + dimId.toUpperCase() + '】' + issue.substring(0, 35));
                    }
                });
            }
        });
        
        if (actionItems.length > 0) {
            insights.push({
                type: 'neutral',
                icon: '💡',
                title: '改进建议',
                text: '建议优先改进：' + actionItems.slice(0, 2).join('；') + '。建议召开复盘会议，制定具体改进措施（Who-When-What）并明确责任人。',
                meta: '建议改进'
            });
        }
    }
    
    // ══分析9：趋势预测（基于历史数据预测下月表现）═
    if (history.length >= 2) {
        var lastTwo = history.slice(-2);
        var trendScore = 0;
        lastTwo.forEach(function(h) {
            trendScore += Math.round(Object.values(h.dims).reduce(function(a, b) { return a + b; }, 0) / 6);
        });
        trendScore = Math.round(trendScore / 2);
        
        var trendText = '';
        if (trendScore > totalScore + 2) {
            trendText = '基于前2个月平均得分' + trendScore + '分，预测下月可能回升，建议保持当前改进措施。';
        } else if (trendScore < totalScore - 2) {
            trendText = '基于前2个月平均得分' + trendScore + '分，预测下月可能继续下滑，建议紧急制定扭转措施。';
        } else {
            trendText = '基于前2个月平均得分' + trendScore + '分，预测下月表现将保持稳定。';
        }
        
        insights.push({
            type: 'neutral',
            icon: '🔮',
            title: '趋势预测',
            text: trendText + '建议结合市场环境、产能规划、技术突破等因素综合判断。',
            meta: '预测' + trendScore + '分'
        });
    }
    
    // ══限制最多9条洞察（避免信息过载）═
    insights = insights.slice(0, 9);
    
    // 如果没有生成任何洞察，添加默认洞察
    if (insights.length === 0) {
        insights.push({
            type: 'neutral',
            icon: '🔍',
            title: '数据稳定',
            text: month + '月数据显示各维度得分相对稳定，综合评分' + totalScore + '分。建议持续关注趋势变化，及时发现问题并改进。',
            meta: '稳定观察'
        });
    }
    
    return { insights: insights, analysisTime: new Date().toLocaleString() };
}
