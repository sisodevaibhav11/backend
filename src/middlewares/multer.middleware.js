import multer from 'multer';                                           //for file upload

const storage = multer.diskStorage({                                          //to store files temporarily on disk
    destination: function (req, file, cb) {                                  //specify the destination folder
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {                                     //specify the file name
        cb(null, file.originalname)                                    //file.fieldname is the name of the field in the form 
    }   
});

const upload = multer({ storage: storage});                //initialize multer with the storage configuration
export { upload };