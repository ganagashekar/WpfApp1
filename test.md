You are a Senior Quant Researcher, Senior Machine Learning Engineer and Python Architect.

I have a SQLite database called

MergedDB.db

Table:

stock_data

It contains

- 756+ columns
- 15,000+ rows
- Multiple trading dates
- Thousands of stocks

The database already contains many engineered features.

Examples

Momentum
TrendStrength
BuyerPressure
SellerPressure
SmartMoneyScore
FocusScore
ScannerScore
BreakoutScore
PredictionScore
TomorrowScore
AccumulationScore
VolumeSurge
Rank_*
RankChange_*
RankPercent_*
Delta_*
Ratio_*
Live_*
Projected_*

==================================================

IMPORTANT

Do NOT use any future information.

No data leakage.

The existing code incorrectly uses

TomorrowScore

PredictionScore

BreakoutScore

Rank columns

inside the feature list while also using them as labels.

That is NOT allowed.

Automatically detect and remove all leakage columns.

==================================================

TASK

Build a COMPLETE professional backtesting engine.

==================================================

STEP 1

Read SQLite database.

Automatically detect

Date column

Symbol column

Price column

==================================================

STEP 2

Profile every column.

Generate

Profile.xlsx

containing

Datatype

Missing %

Unique Count

Minimum

Maximum

Average

Median

Std

==================================================

STEP 3

Automatically classify columns.

Price

Volume

Momentum

Trend

Buyer Pressure

Seller Pressure

Smart Money

Scanner

Breakout

Prediction

Rank

Delta

Ratio

Live

Projected

Fundamental

==================================================

STEP 4

Automatically detect leakage columns.

Remove columns containing

tomorrow

prediction

predscore

score

breakout

confirmedbreakout

future

forward

label

target

rank_

prevrank

rankchange

rankpercent

DO NOT allow leakage.

==================================================

STEP 5

Automatically determine best target.

Priority

confirmedbreakout

isrealbreakout

possiblebreakout

tomorrowscore

prediction_score

predictionscore

If none exist

create

forward_return

using next day's LTP.

Ignore last observations without next day.

==================================================

STEP 6

Ignore tiny trading days.

If a trading day has

less than

300 stocks

ignore it.

==================================================

STEP 7

Walk Forward Validation.

Train

Day1

Test

Day2

Train

Day1 Day2

Test

Day3

Continue until last day.

Never use future data.

==================================================

STEP 8

Feature Engineering

Automatically create

Momentum Change

Momentum 3 Day Mean

Momentum 5 Day Mean

Trend Change

Buyer Pressure Change

Seller Pressure Change

Volume Growth

Rolling Mean

Rolling Std

Rolling Max

Rolling Min

Z Score

Percent Change

==================================================

STEP 9

Remove highly correlated features.

Threshold

0.95

==================================================

STEP 10

Feature Selection.

Compare

ExtraTrees

RandomForest

Mutual Information

Recursive Feature Elimination

Select top features automatically.

==================================================

STEP 11

Train models.

RandomForest

ExtraTrees

XGBoost

LightGBM

CatBoost

Logistic Regression

Compare every model.

==================================================

STEP 12

Hyperparameter tuning.

Use

Optuna

for

XGBoost

LightGBM

CatBoost

==================================================

STEP 13

Do NOT evaluate Accuracy only.

Calculate

Accuracy

Balanced Accuracy

Precision

Recall

F1

ROC AUC

PR AUC

MCC

Cohen Kappa

==================================================

STEP 14

Trading Evaluation.

Rank stocks using probability.

Take

Top 20

Top 50

Top 100

Calculate

Average Return

Median Return

Win Rate

Maximum Drawdown

Sharpe Ratio

Sortino Ratio

Profit Factor

==================================================

STEP 15

Explain predictions.

Use

SHAP

Generate

Top 100 Feature Importance

==================================================

STEP 16

Generate Reports.

Profile.xlsx

FeatureImportance.xlsx

DailyResults.xlsx

FoldResults.xlsx

ModelComparison.xlsx

Top20Predictions.xlsx

Top50Predictions.xlsx

Summary.xlsx

==================================================

STEP 17

Generate Charts.

Feature Importance

ROC

PR Curve

Confusion Matrix

Daily Accuracy

Daily Profit

Cumulative Return

Model Comparison

==================================================

STEP 18

Code Quality

Python 3.12

Use classes

Use logging

Use progress bars

Use multiprocessing

Handle missing columns automatically

Never hardcode feature names

Generate production quality code.

==================================================

IMPORTANT

Generate the project in multiple Python files.

Do NOT generate one huge file.

Project structure

config.py

database.py

feature_engineering.py

feature_selection.py

targets.py

models.py

walkforward.py

backtester.py

reports.py

charts.py

main.py

requirements.txt

README.md

The code must be fully runnable in Google Colab.

If the response is too long, continue automatically until every file has been generated.
