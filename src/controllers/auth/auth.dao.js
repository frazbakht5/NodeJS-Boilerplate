/* eslint-disable no-return-await */
const Crud = require('../../utils/Mongo/Crud');
const { UserModel } = require('../../models/index');

class AuthDaoService {
  static async updateUser(id, params) {
    return await Crud.updateOneAndReturn(UserModel, { _id: id }, params);
  }
}
module.exports = AuthDaoService;
