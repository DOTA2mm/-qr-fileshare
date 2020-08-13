const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const multer = require('multer');
const express = require('express');
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const originalname = file.originalname
    const fileExt = originalname.slice(originalname.lastIndexOf('.'))
    const fileName = originalname.slice(0, originalname.lastIndexOf('.'))

    cb(null, `${fileName}-${Math.random().toString(36).slice(2)}${fileExt}`);
  }
});
const upload = multer({storage});

module.exports = (app) => {
  const persistentStorage = require('../index').storage;

  // Generated QR Image
  app.use('/generated_qr.svg', express.static('generated_qr.svg'));

  // Get list of all files
  app.get('/api/files/', (req, res) => {
    getFileArrayFromStorage(persistentStorage)
        .then(files => res.json(files))
        .catch(err => res.send(err));
  });

  // Download file
  app.get('/api/file/:fileId', (req, res) => {
    persistentStorage.get(req.params.fileId)
        .then(fileObject => {
          const options = {
            headers: {
              'Content-type': fileObject.mimetype
            }
          };
          res.download(fileObject.path, fileObject.originalname, options);
        })
  });

  // Upload
  app.post('/api/files/', upload.array('file'), (req, res) => {
    try {
      let initialCount = app.locals.fileCount;
      let newFilesDetails = req.files.map((file) => {
        return {...file, id: app.locals.fileCount++} // Increase the count too
      });

      // Update the list of files in persistent persistentStorage
      // First create list of promises, then proceed on completion of all
      let persistentStoragePromises = newFilesDetails.map((fileInfo) =>
          persistentStorage.setItem((initialCount++).toString(), fileInfo)
      );

      Promise.all(persistentStoragePromises).then(() => {
        getFileArrayFromStorage(persistentStorage)
            .then(files => {
              app.locals.io.emit('file list update', JSON.stringify(files));
            })
            .catch(err => res.send(err));
        res.sendStatus(201);
      });

    } catch (e) {
      res.send(e);
    }
  });

// Delete
  app.delete('/api/file/:fileId', (req, res) => {
    persistentStorage.removeItem(req.params.fileId).then(() => {
      getFileArrayFromStorage(persistentStorage).then(files => {
        app.locals.io.emit('file list update', JSON.stringify(files));
        res.sendStatus(204);
      })
    });
  });

  // Upload clipboard text
  app.post('/api/clipboard', (req, res) => {
    const clipboardText = req.body.text;
    mkdirp(path.resolve(__dirname, '../uploads')).then(() => {
      fs.writeFile(path.resolve(__dirname, '../uploads', 'clipboard.txt'), clipboardText, (e) => {
        res.sendStatus(201);
      })
    }).catch(e => {
      res.status(502).send('Unknow error.');
    })
  });

  app.get('/api/clipboard', (req, res) => {
    fs.readFile(path.resolve(__dirname, '../uploads', 'clipboard.txt'), (e, data) => {
      res.send(e ? '' : data.toString());
    })
  })
};

const isPreviewableImage = (file) => {
  const validSize = file.size < (2 * 1024 * 1024); // < 2MB
  const validMimeType = file.mimetype.split("/")[0] === "image";
  return validSize && validMimeType;
};

const getFileArrayFromStorage = (storage) => {
  return storage.values()
      .then(filesObject => {
        return Object.values(filesObject).map(file => {
          const sendData = isPreviewableImage(file);
          if (sendData) {
            file.buffer = fs.readFileSync(file.path);
          }

          return file;
        })
      });
};