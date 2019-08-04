const Config                    = require("./../../config");

const fs                        = require('fs');
const path                      = require('path');
const crypto                    = require('crypto');


class FileSystemStorage {

    static fileSave(uploadfile) {

        let result = {};
        let file = new Buffer(uploadfile.file, 'base64');
        let dirPath = path.resolve(Config.media.saveDir);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        let fileHash = crypto.createHash('md5').update(file).digest("hex");
        let fileName = `${fileHash}.${uploadfile.fileName.split('.').pop()}`;
        result.fileUrl = `${Config.media.urlPath}/${fileName}`;
        fs.writeFileSync(path.join(dirPath, fileName), file);

        return result;
    }
}


module.exports = FileSystemStorage;
