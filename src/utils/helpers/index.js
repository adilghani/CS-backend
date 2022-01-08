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


const convertStringToHash = str => {
  let hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export {
  timeStamp,
  convertStringToHash
};
