export const searchValue = (
  array,
  fieldToSearch,
  searchValue,
  keysToExclude
) => {
  return array?.filter(
    (obj) =>
      (searchValue === "" ||
        !keysToExclude?.some((key) => obj.hasOwnProperty(key))) &&
      obj[fieldToSearch]?.toLowerCase().includes(searchValue?.toLowerCase())
  );
};
