import { Router } from 'express';
import * as fileController from '../controllers/fileController.js';
import { authIfEnabled } from '../middlewares/auth.js';

const router = Router();

router.post('/', authIfEnabled, fileController.uploadFile);
router.get('/:id/progress', fileController.getProgress);
router.get('/:id/stream', fileController.streamProgress);
router.get('/:id', fileController.getFileContent);
router.get('/', fileController.listFiles);
router.delete('/:id', authIfEnabled, fileController.deleteFile);

export default router;