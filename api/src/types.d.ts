export type Datasource = {
  url: string;
  options: {
    range: string;
    columns: Record<string, string>;
  };
};

export type FolderDocument = {
  created: string;
  description: string;
  id: string;
  image: string;
  name: string;
  thumbnail: string;
  type: string;
};
