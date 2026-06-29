const { ZodError } = require('zod');

/**
 * Generic validation middleware factory.
 * Pass in a zod schema; validates req.body and replaces it with the parsed
 * (and type-coerced) result so downstream handlers get clean data.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
