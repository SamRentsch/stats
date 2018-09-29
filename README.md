# inf-client-samrentsch

> share data analysis

Motivation for creating app is to learn about share data analysis.

## Prerequisites

Node

## Environment variables

Environment variables can be passed to app.js in an `.env` file.

App requires the following environment variables:

```
REJECT_BELOW=ValueToReject
SMA_CLOSE=ValueOfCloseSMA
```

Notes:

* **REJECT_BELOW** is used to filter stocks that have not closed above a certain amount. **ValueToReject** is the amount to filter on. For example `REJECT_BELOW=200` would filter all stocks that have closed below $200.00.
* **SMA_CLOSE** is used to define the value of the simple moving average (SMA) applied to the close price. **ValueOfCloseSMA** is the value used. For exmple `SMA_CLOSE=6`.

## Usage

```
npm install
npm run start
```
---

Please feel free to suggest improvements on [issues](https://github.com/influencerTips/inf-client-samrentsch/issues)
