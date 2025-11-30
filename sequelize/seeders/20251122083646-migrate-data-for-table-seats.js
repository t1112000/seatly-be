'use strict';

const { v4: uuidv4 } = require('uuid');

const buildSeat = ({
  row_label,
  col_number,
  type = 'STANDARD',
  price,
  status = 'AVAILABLE',
  version = 0,
}) => ({
  id: uuidv4(),
  row_label,
  col_number,
  seat_number: `${row_label}${col_number}`,
  type,
  price,
  status,
  version,
  created_at: new Date(),
  updated_at: new Date(),
});

const layout = [
  { row_label: 'A', type: 'STANDARD', price: 120000, columns: 10 },
  { row_label: 'B', type: 'STANDARD', price: 120000, columns: 10 },
  { row_label: 'C', type: 'STANDARD', price: 120000, columns: 10 },
  { row_label: 'D', type: 'VIP', price: 150000, columns: 10 },
  { row_label: 'E', type: 'VIP', price: 150000, columns: 10 },
  { row_label: 'F', type: 'VIP', price: 150000, columns: 10 },
  { row_label: 'G', type: 'COUPLE', price: 200000, columns: 5 },
  { row_label: 'H', type: 'COUPLE', price: 200000, columns: 5 },
];

const statusOverrides = new Map([
  ['A1', 'BOOKED'],
  ['A2', 'LOCKED'],
  ['B3', 'LOCKED'],
  ['C1', 'BOOKED'],
  ['C2', 'LOCKED'],
  ['F1', 'BOOKED'],
  ['D2', 'LOCKED'],
  ['G1', 'BOOKED'],
  ['G2', 'LOCKED'],
  ['H1', 'BOOKED'],
  ['H4', 'LOCKED'],
]);

const seedSeats = layout.flatMap(({ row_label, type, price, columns }) =>
  Array.from({ length: columns }, (_, index) => {
    const col_number = index + 1;
    const seat_number = `${row_label}${col_number}`;
    return buildSeat({
      row_label,
      col_number,
      type,
      price,
      status: statusOverrides.get(seat_number) || 'AVAILABLE',
    });
  }),
);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('seats', seedSeats);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      'seats',
      {
        seat_number: {
          [Op.in]: seedSeats.map((seat) => seat.seat_number),
        },
      },
      {},
    );
  },
};
