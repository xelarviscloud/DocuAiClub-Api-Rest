import { BlobServiceClient } from "@azure/storage-blob";

const connStr = process.env.AZURE_STORAGE_CONNECTION;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const getAzureBlobAsBuffer = async (blobPath) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

  const downloadBlockBlobResponse = await blockBlobClient.download(0);

  const fileStream = downloadBlockBlobResponse.readableStreamBody;

  // // Convert the file stream to a Buffer
  const chunks = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);

  return fileBuffer;
};

export default getAzureBlobAsBuffer;
