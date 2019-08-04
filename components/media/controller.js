const MediaTools                = require('./fileSystemStorage');


module.exports = {

    path: 'media',

    permissions: {
        POST: 'Media.Create'
    },

    POST: [

        /*
        example request

         POST /media HTTP/1.1
         Host: localhost:3000
         Content-Type: application/json

         {
             "fileName":"pixel.gif",
             "file":"R0lGODlhCgAKAIABALG1ucPHyywAAAAACgAKAAACEYSPEMtr3R50agY5MdSx5pQUADs="
         }

        */

        function () {
            return MediaTools.fileSave(this.request.body);
        }
    ]

};
