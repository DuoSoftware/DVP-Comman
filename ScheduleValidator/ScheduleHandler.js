/**
 * Created by dinusha on 7/13/2016.
 */
var moment = require('moment');

var CheckScheduleValidity = function(schedule)
{
    var pickedAppointment = null;
    try
    {
        if(schedule && schedule.TimeZone && schedule.Appointment && schedule.Appointment.length > 0)
        {
            var utcTime = new Date().toISOString();
            var localTime = moment(utcTime).utcOffset(schedule.TimeZone);
            var dateOnly = moment(localTime).format('YYYY-MM-DD');
            var timeOnly = moment(localTime).format('HH:mm:ss');
            var dayOfWeek = moment(localTime).format('dddd');

            for(var i = 0; i<schedule.Appointment.length; i++)
            {
                var startDate = schedule.Appointment[i].StartDate;
                var endDate = schedule.Appointment[i].EndDate;
                var startTime = schedule.Appointment[i].StartTime;
                var endTime = schedule.Appointment[i].EndTime;
                var daysOfWeek = schedule.Appointment[i].DaysOfWeek;


                var dateMatching = false;
                var timeMatching = false;
                var dayOfWeekMatching = false;

                if(startDate && endDate)
                {
                    if(moment(dateOnly).isBetween(startDate, endDate, null, '[]'))
                    {
                        dateMatching = true;
                    }
                }
                else
                {
                    dateMatching = true;
                }

                if(startTime && endTime)
                {
                    if(moment(timeOnly).isBetween(startTime, endTime, null, '[]'))
                    {
                        timeMatching = true;
                    }
                }
                else
                {
                    timeMatching = true;
                }

                if(daysOfWeek)
                {
                    if(daysOfWeek.indexOf(dayOfWeek) > -1)
                    {
                        dayOfWeekMatching = true;
                    }
                }
                else
                {
                    dayOfWeekMatching = true;
                }

                if(dateMatching && timeMatching && dayOfWeekMatching)
                {
                    pickedAppointment = schedule.Appointment[i];
                    break;
                }


            }
        }

        return pickedAppointment;

    }
    catch(ex)
    {
        return pickedAppointment;
    }

}

module.exports.CheckScheduleValidity = CheckScheduleValidity;