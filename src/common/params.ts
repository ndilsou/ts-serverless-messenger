let tableName: string;

export const getTableName = () => {
  if (!tableName) {
    tableName = process.env.TABLE_NAME!;
  }
  return tableName;
};
