"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timeStamp = exports.convertStringToHash = void 0;

const timeStamp = schema => {
  schema.add({
    createdAt: Date,
    updatedAt: Date
  });
  schema.pre('save', function (next) {
    const now = Date.now();
    this.updatedAt = now;

    if (!this.createdAt) {
      this.createdAt = now;
    }

    next();
  });
  schema.pre('updateOne', function (next) {
    const now = Date.now();
    this.updatedAt = now;

    if (!this.createdAt) {
      this.createdAt = now;
    }

    next();
  });
};

exports.timeStamp = timeStamp;

const convertStringToHash = str => {
  let hash = 0,
      i,
      chr;
  if ((void 0).length === 0) return hash;

  for (i = 0; i < (void 0).length; i++) {
    chr = (void 0).charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
};

exports.convertStringToHash = convertStringToHash;
//# sourceMappingURL=index.js.map