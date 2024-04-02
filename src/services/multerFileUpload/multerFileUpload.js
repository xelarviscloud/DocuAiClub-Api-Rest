import multer from "multer";
import MulterAzureStorage from "multer-azure-storage";
import uuid4 from "uuid4";

var getFileName = function (file) {
  //return "145.pdf";
  let uid = uuid4();
  console.log(uid.replace("-", ""));
  return `${uid.replace("-", "")}/${file.originalname}`;
  // or return file.name;
};

var upload = multer({
  storage: new MulterAzureStorage({
    azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION,
    containerName: process.env.AZURE_STORAGE_CONTAINER,
    containerSecurity: "blob",
    fileName: getFileName,
  }),
});
export default upload;
