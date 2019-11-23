[X] - /getFreeTines
IN:         ["startDate", "string"],
            ["endDate", "string"],
            ["lat", "number"],
            ["long", "number"],
            ["radius", "number"],

OUT: 200, Map (userID | Array: startDate = string, endDate = string)
OUT: 500, BasicError

[X] - /updateUserPosition

IN:         ["lat", "number"],
            ["long", "number"],

OUT: 200 | 500

[X] - /askForAppointment

[X] - /getMyAppointmentDemands

[X] - /getMyAppointmentSent

[X] - /acceptAppointments

[X] - /refuseAppointment

[X] - /getAppointments

[X] - /cancelAppointmentDemand       TODO

[X] - /updateUserPosition

[X] - /cancelAppointment             TODO

[X] = /supressFreeTime               TODO

[X] = /postFreeTimes
