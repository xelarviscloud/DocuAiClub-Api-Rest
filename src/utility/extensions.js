export const shortCircuitEvaluation = (value) => {
  let _evaluation = false || null || "" || 0 || NaN || undefined || value;

  if (_evaluation == "undefined" || _evaluation == "null") {
    _evaluation = false;
  } else {
    _evaluation = value;
  }
  return _evaluation;
};

/**
 * Help function: doesUserAlreadyExists
 * @param collections
 * @param field
 * @param value
 * @returns
 */
export const doesUserAlreadyExists = async (collections, field, value) => {
  for (const collection of collections) {
    const existingRecord = await collection.findOne({ [field]: value });
    if (existingRecord) {
      return true;
    }
  }
  return false;
};
