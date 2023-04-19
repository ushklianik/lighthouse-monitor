const fs = require('fs');
const csv = require('csv-parser');

export class userFeeder {
  constructor() {
    this.users = [];
    this.userId = 0;
  }

  async loadUsers(filename) {
    this.users = await this.loadCSV(filename);
  }

  async loadCSV(filename) {
    return new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', () => {
          resolve(rows);
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  }

  getNextUser() {
    if (this.users.length === this.userId) {
        this.userId = 0;
    }
    var user = this.users[this.userId];
    this.userId += 1;
    return user;
  }
}