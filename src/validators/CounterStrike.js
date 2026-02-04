import Schema from '../schemas/CounterStrike.js';
import validator from './validator.js';

const CounterStrike = (data, isUpdate = false, firstTime = false) => {
  validator(data, Schema, isUpdate, firstTime);
};

export default CounterStrike;
