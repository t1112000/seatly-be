'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('seats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      row_label: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Seat row label: A, B, C...',
      },
      col_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Seat column position: 1, 2, 3...',
      },
      seat_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Display label printed on ticket, e.g. A1, B5',
      },
      type: {
        type: Sequelize.ENUM('VIP', 'STANDARD', 'COUPLE'),
        allowNull: false,
        defaultValue: 'STANDARD',
        comment: 'Seat type classification: VIP, STANDARD, COUPLE',
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'LOCKED', 'BOOKED'),
        allowNull: false,
        defaultValue: 'AVAILABLE',
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('seats', ['row_label', 'col_number'], {
      name: 'idx_seats_row_col',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('seats', 'idx_seats_row_col');
    await queryInterface.dropTable('seats');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_seats_status";',
    );
  },
};
