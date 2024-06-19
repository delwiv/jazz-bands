// const moment = require('moment');
// const _ = require('lodash');
// const Promise = require('bluebird');
//
// module.exports = function(DateJazz) {
//     DateJazz.fixDates = function(next) {
//         const promises = [];
//         this.find({}, (err, items) => {
//             _.forEach(items, i => {
//                 i.datetime = moment(i.datetime, 'DD/MM/YYYY - HH:mm') || null;
//                 // console.log(i.datetime);
//                 if (!i.datetime)
//                     promises.push(i.destroy(() => Promise.resolve()));
//                     // // console.log('destroy : ' + i.datetime);
//                 else
//                     promises.push(i.save(() => Promise.resolve()))
//                     // // console.log('save    : ' + i.datetime);
//             });
//             Promise.all(promises).then(() => // console.log('Finished'))
//         })
//     };
//
//     DateJazz.remoteMethod('fixDates', {
//         accepts: {arg: 'data', type: 'string'},
//         returns: {}
//     });
// };
