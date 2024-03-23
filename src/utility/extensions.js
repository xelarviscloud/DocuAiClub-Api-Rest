const shortCircuitEvaluation = (value) => {
  let _evaluation = false || null || "" || 0 || NaN || undefined || value;

  if (_evaluation == "undefined" || _eva_evaluationulation == "null") {
    _evaluation = false;
  } else {
    _evaluation = value;
  }
  return _evaluation;
};

export default shortCircuitEvaluation;
