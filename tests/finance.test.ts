import assert from "node:assert/strict";
import test from "node:test";
import { budgetStatus, cloneDemoData, forecastMonthEnd, formatINR, getSummary, spendByCategory, toCsv } from "../src/lib/finance.ts";

test("INR formatter uses Indian digit grouping", () => {
  assert.match(formatINR(125000), /1,25,000/);
});

test("demo dashboard produces coherent financial summary", () => {
  const data = cloneDemoData();
  const summary = getSummary(data);
  assert.ok(summary.income > 0);
  assert.ok(summary.expenses > 0);
  assert.equal(summary.savings, summary.income - summary.expenses);
  assert.ok(Number.isFinite(summary.savingsRate));
});

test("category spend is ranked from highest to lowest", () => {
  const ranked = spendByCategory(cloneDemoData());
  assert.ok(ranked.length > 0);
  for (let i = 1; i < ranked.length; i += 1) assert.ok(ranked[i - 1].amount >= ranked[i].amount);
});

test("budgets never return invalid percentages", () => {
  for (const budget of budgetStatus(cloneDemoData())) {
    assert.ok(Number.isFinite(budget.percent));
    assert.ok(budget.limit > 0);
    assert.equal(budget.remaining, budget.limit - budget.used);
  }
});

test("month-end forecast does not project below already-recorded expenses", () => {
  const data = cloneDemoData();
  const current = getSummary(data).expenses;
  const forecast = forecastMonthEnd(data);
  assert.ok(forecast.projectedExpenses >= current);
  assert.match(forecast.confidence, /^(low|medium|high)$/);
});

test("CSV export has a stable header and data rows", () => {
  const csv = toCsv(cloneDemoData());
  assert.ok(csv.startsWith("date,type,description,category,account,amount"));
  assert.ok(csv.split("\n").length > 5);
});
