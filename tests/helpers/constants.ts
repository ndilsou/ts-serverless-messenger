export const TABLE_NAME = "test";

export const DDB_OPTIONS = {
  apiVersion: "2012-08-10",
  region: "eu-west-2",
  endpoint: "http://localhost:8000",
};

export const SAMPLE_ITEMS = {
  USERS: [
    {
      id: "1",
      email: "yolo@gmail.com",
      createdDate: new Date(2020, 5, 1),
      updatedDate: new Date(2020, 5, 2),
    },
    {
      id: "2",
      email: "wow@gmail.com",
      createdDate: new Date(2019, 2, 1),
      updatedDate: new Date(2020, 5, 2),
    },
    {
      id: "3",
      email: "doge@gmail.com",
      createdDate: new Date(2018, 6, 1),
      updatedDate: new Date(2019, 9, 2),
    },
  ],
  CONVOS: [
    {
      id: "1",
      createdDate: new Date(2020, 6, 2),
      updatedDate: new Date(2020, 7, 2),
      alias: "The Gang is back in town",
    },
  ],
};
