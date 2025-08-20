import * as fileService from "../services/fileService.js";

export async function uploadFile(req, res, next) {
  try {
    await fileService.handleUpload(req, res);
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req, res, next) {
  try {
    const result = await fileService.getProgress(req.params.id);
    if (!result)
      return res.status(404).json({ error: "Not found" });

    res.json(result);
    
  } catch (err) {
    next(err);
  }
}

export async function streamProgress(req, res) {
  return fileService.handleSSE(req, res);
}

export async function getFileContent(req, res, next) {
  try {
    const result = await fileService.getFileContent(req.params.id, req.query);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
}

export async function listFiles(req, res, next) {
  try {
    const files = await fileService.listFiles();
    res.json(files);
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    await fileService.deleteFile(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
