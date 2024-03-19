/**
 * Send Error Response Function
 * @param {*} response
 * @param {*} value
 * @param {*} errMag
 * @returns
 */
const sendErrorResponse = (response, value, errMag) => {
  if (value === undefined || value === "" || value === null) {
    response.status(400).send({
      status: "failed",
      msg: errMag,
    });
    return true;
  } else {
    return false;
  }
};
export { sendErrorResponse };
