'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'stripe_customer_id', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addIndex('users', ['stripe_customer_id'], {
      name: 'users_stripe_customer_id_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_stripe_customer_id_index');
    await queryInterface.removeColumn('users', 'stripe_customer_id');
  },
};
