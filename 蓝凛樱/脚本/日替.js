/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*********************************!*\
  !*** ./example_src/src/main.ts ***!
  \*********************************/

eventOn('mag_variable_update_started', variableUpdateStarted);
eventOn('mag_variable_updated', variableUpdated);
eventOn('mag_variable_update_ended', variableUpdateEnded);
let last_date = "";
let is_day_passed = false;
function parseTimeToNumber(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + (minutes || 0);
}
function variableUpdateStarted(variables, out_is_updated) {
    last_date = variables.stat_data.日期[0];
    is_day_passed = false;
    out_is_updated = out_is_updated || false;
}
function variableUpdated(_stat_data, path, _oldValue, _newValue) {
    if (path == '时间') {
        const timeNumber = parseTimeToNumber(_newValue);
        const oldTime = parseTimeToNumber(_oldValue);
        //当时间变小时，就代表新的一天来临了
        if (timeNumber < oldTime) {
            is_day_passed = true;
        }
    }
}
/**
 * 计算下一天的日期
 * @param dateStr 日期字符串，格式为"MM月DD日"，例如"1月1日"
 * @returns 下一天的日期字符串，保持相同格式
 */
function nextDate(dateStr) {
    // 移除末尾的"日"字，并分割月份和日期
    const [month, day] = dateStr.replace('日', '').split('月');
    let nextMonth = parseInt(month);
    let nextDay = parseInt(day);
    nextDay++;
    const daysInMonth = [31, 31, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (nextDay > daysInMonth[nextMonth - 1]) {
        nextDay = 1;
        nextMonth++;
        if (nextMonth > 12) {
            nextMonth = 1;
        }
    }
    // 返回时需要加上"日"后缀
    return `${nextMonth}月${nextDay}日`;
}
function variableUpdateEnded(variables, out_is_updated) {
    if (!is_day_passed)
        return;
    if (variables.stat_data.日期[0] == last_date) {
        // 日期字符串必须包含"日"字作为后缀，例如"1月1日"
        //llm 没有自动推进日期，通过代码辅助他推进
        var new_date = nextDate(last_date);
        variables.stat_data.日期[0] = new_date;
        const display_str = `${last_date}->${new_date}(日期推进)`;
        variables.display_data.日期 = display_str;
        out_is_updated = true;
    }
    out_is_updated = out_is_updated || false;
}

/******/ })()
;
//# sourceMappingURL=example_bundle.js.map