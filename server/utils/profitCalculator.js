exports.calculateWeightedRate = (deposits) => {
  const totalAmt = deposits.reduce((s, d) => s + d.amount, 0);
  if (totalAmt === 0) return 0;
  const weightedSum = deposits.reduce((s, d) => s + (d.amount * d.rate), 0);
  return weightedSum / totalAmt;
};

exports.calcConversionProfit = ({ depositedQAR, factor, avgRate, advanceAED, advanceRate }) => {
  const convertedQAR = depositedQAR * (factor || 0.95);
  const qarValue = convertedQAR * avgRate;
  const advancePKR = advanceAED * advanceRate;
  return { convertedQAR, qarValue, advancePKR, netProfit: qarValue - advancePKR };
};
