const bleno = require('bleno');
const { matrixToArray, ledMatrix } = require('../matrix');
const events = require('events');
const Characteristic = bleno.Characteristic;
const em = new events.EventEmitter();

const startScreen = ledMatrix.heart;

let matrix = matrixToArray(startScreen);

module.exports = (setMatrix) => {
  setMatrix(matrix);
  return {
    uuid: '9f66b797148b4f7a9f59a5b0ee38923e',
    characteristics: [
      new Characteristic({
        uuid: 'ef36dea493104b69bcf3c17fef1ee84c', // display
        properties: ['read', 'write', 'notify'],
        onReadRequest: (offset, callback) => {
          const result = Characteristic.RESULT_SUCCESS;
          const data = new Buffer(matrix);

          callback(result, data);
        },
        onWriteRequest: (data, offset, withoutResponse, callback) => {
          if (data.length !== 7 * 11) {
            console.log('ERROR: invalid data', data);
            callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
            return;
          }

          matrix = Array.from(data);
          em.emit('MATRIX_UPDATE', matrix);
          setMatrix(matrix);
          callback(Characteristic.RESULT_SUCCESS);
        },
        onSubscribe: (maxValueSize, updateValueCallback) =>
          em.addListener('MATRIX_UPDATE', (matrix) =>
            updateValueCallback(new Buffer(matrix))
          ),
      }),
    ],
  };
};
