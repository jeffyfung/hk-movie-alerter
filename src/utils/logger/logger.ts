import moment from 'moment';

function info(data: any) {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}`, data);
}

function error(...err: any[]) {
  console.error(moment().format('YYYY-MM-DD HH:mm:ss'), ...err);
}

export default {
  info,
  error,
};
