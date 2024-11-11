
const durationFormat = new Intl.RelativeTimeFormat('en', { style: 'long', numeric: 'always' })

const ONE_MINUTE = 
  1000 // ms
  * 60 // sec

const ONE_HOUR = ONE_MINUTE * 60;

const ONE_DAY = ONE_HOUR * 24

export function generateRelativeDateFormat(date: Date) {
  const now = Date.now();
  const inputValue = date.valueOf();

  const diff = inputValue - now;
  const diffABS = Math.abs(diff);

  switch(true) {
    case diffABS < ONE_MINUTE:
      return durationFormat.format(Math.round(diff / 1000), 'seconds')
    case diffABS > ONE_MINUTE && diffABS < ONE_HOUR:
      return durationFormat.format(Math.round(diff / ONE_MINUTE), 'minutes')
    case diffABS > ONE_HOUR && diffABS < ONE_DAY:
      return durationFormat.format(Math.round(diff / ONE_HOUR), 'hours')
    case diffABS > ONE_DAY:
      return durationFormat.format(Math.round(diff / ONE_DAY), 'days')
  }
}