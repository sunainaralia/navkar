const developmentError = (error, res) => {
  return res.status(error.errorStatus).json({
    status: error.errorStatus,
    msg: error.message,
    stackTrace: error.stack,
    error: error
  });
};

const productionError = (error, res) => {
  if (error.isOprationError) {
    return res.status(error.errorStatus).json({
      status: error.errorStatus,
      message: error.message,
    });
  } else {
    return res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
};

const castError = (error, res) => {
  const err = `Your id ${error.value} is not correct for ${error.path} field`;
  return res.status(400).json({
    status: 400,
    message: err,
  });
};

const duplicateError = (error, res) => {
  let msg = `${Object.keys(error.keyValue)[0]} must be unique`;
  return res.status(400).json({
    status: 400,
    message: msg,
  });
};

const validationError = (error, res) => {
  const errMsg = Object.values(error.errors).map(err => err.message);
  return res.status(400).json({
    status: 400,
    message: `Validation Error: ${errMsg.join(". ")}`,
  });
};

const invalidTokenError = (error, res) => {
  return res.status(401).json({
    status: 401,
    message: `Token is not valid. Please provide a valid token.`,
  });
};

const tokenExpiredError = (error, res) => {
  return res.status(401).json({
    status: 401,
    message: "Token has expired",
  });
};

const errorHandling = (error, req, res, next) => {
  error.errorStatus = error.errorStatus || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === "development") {
    return developmentError(error, res);
  } else {
    switch (error.name) {
      case "CastError":
        return castError(error, res);
      case "ValidationError":
        return validationError(error, res);
      case "JsonWebTokenError":
        return invalidTokenError(error, res);
      case "TokenExpiredError":
        return tokenExpiredError(error, res);
      default:
        if (error.code === 11000) {
          return duplicateError(error, res);
        }
        return productionError(error, res);
    }
  }
};

export default errorHandling;
