export const normaliseDisplay = (field) => {
  if (field.display_mode || field.display_mode_parameters) {
    return {
      display: {
        mode: field.display_mode || undefined,
        parameters: field.display_mode_parameters || undefined,
      },
    };
  }

  // Alternative syntax
  if (field.displayMode || nonEmptyObject(field.displayModeParameters)) {
    return {
      display: {
        mode: field.displayMode || undefined,
        parameters: nonEmptyObject(field.displayModeParameters) ? field.displayModeParameters : undefined,
      },
    };
  }

  return {};
};

const nonEmptyObject = (obj) => obj && Object.keys(obj).length;
