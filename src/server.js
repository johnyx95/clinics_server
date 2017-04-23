var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var express = require('express');
var pretty = require('express-prettify');

var db = new sqlite3.Database('ClinicsDB2.db');
var restapi = express();
var clinic_info = " Clinic.id, Clinic.logo_url, Clinic.name, Clinic.rating, Clinic.short_description," +
    "Clinic.full_description, Clinic.location, Clinic.has_parking_lot, Clinic.has_epay, Clinic.speak_english," +
    "Clinic.has_wifi, Clinic.has_pharamcy, Clinic.has_children_room, Clinic.has_invalid ";
var clinic_info_wth_id = " Clinic.logo_url, Clinic.name, Clinic.rating, Clinic.short_description," +
    "Clinic.full_description, Clinic.location, Clinic.has_parking_lot, Clinic.has_epay, Clinic.speak_english," +
    "Clinic.has_wifi, Clinic.has_pharamcy, Clinic.has_children_room, Clinic.has_invalid ";

restapi.use(pretty({query: 'pretty'}));
restapi.route('/clinic_full_info')
    .get(function (req, res) {
        console.log("start get full info about clinics");
        var clinicId;
        if (res.req.query.clinic_id)
            clinicId = res.req.query.clinic_id;
        var response = {};

        async.series([
            function (callback) { // Full info from Clinic without id
                db.get('Select ' + clinic_info_wth_id + ' from Clinic where Clinic.id = ' + clinicId, function (err, row) {
                    response.clinic = row;
                    callback();
                })
            },
            function (callback) { // District for Clinic.id
                var sqlResponse = 'select District.name from District ' +
                    'left join Location on Location.district_id=District.id ' +
                    'left join Clinic on Clinic.location=Location.id ' +
                    'where Clinic.id = ' + clinicId;
                db.get(sqlResponse, function (err, row) {
                    response.district = row;
                    callback();
                })
            },
            function (callback) { // Services for Clinic.id
                var sqlRequest = 'select Specialization.name, Specialization.id from Specialization ' +
                    'left join Specilizations on Specilizations.specializtion_id = Specialization.id ' +
                    'left join Clinic on Clinic.id = Specilizations.clinic_id ' +
                    'where Clinic.id =' + clinicId;
                db.all(sqlRequest, function (err, row) {
                    response.services = row;
                    callback();
                })
            },
            function (callback) { // address and coordinates for Clinic.id
                var sqlRequest = 'select Location.address, Location.longitude, Location.latitude from Location ' +
                    'left join Clinic on Clinic.id = Location.id ' +
                    'where Clinic.id = ' + clinicId;
                db.get(sqlRequest, function (err, row) {
                    response.location = row;
                    callback();
                })
            },
            function (callback) { // metro name, line
                var sqlRequest = 'select Metro.name, Metro.line from Metro ' +
                    'left join Location on Location.metro_id = Metro.id ' +
                    'left join Clinic on Clinic.location = Location.id ' +
                    'where Clinic.id = ' + clinicId;
                db.get(sqlRequest, function (err, row) {
                    response.metro = row;
                    callback();
                })
            },
            function (callback) {
                var sqlRequest = 'select Worktime.time_interval, Worktime.day_interval from Worktime ' +
                    'left join Clinic on Clinic.id = Worktime.clinic_id ' +
                    'where Clinic.id =' + clinicId;
                db.all(sqlRequest, function (err, row) {
                    response.worktime = row;
                    callback();
                })
            },
            function (callback) {
                var sqlRequest = 'select Photo.url from Photo ' +
                    'left join Clinic on Clinic.id = Photo.clinic_id ' +
                    'where Clinic.id = ' + clinicId;
                db.all(sqlRequest, function (err, row) {
                    response.gallery = row;
                    callback();
                })
            }
        ], function () {
            res.json(response);
        });
        console.log("finish get full info about clinics")
    });
restapi.route('/clinics_services_districts')
    .get(function (req, res) {
        console.log("start get clinic_info with district, services option");
        var specializationId;
        var numPage;
        if (res.req.query.specialization_id)
            specializationId = res.req.query.specialization_id;
        var distirctId;
        if (res.req.query.district_id)
            distirctId = res.req.query.district_id;
        if (res.req.query.num_page)
            numPage = res.req.query.num_page;
        var num = 20 * (numPage - 1);
        if (!specializationId && (!distirctId))
            var sqlRequest = 'SELECT' + clinic_info + 'FROM Clinic ';
        else {
            sqlRequest = 'SELECT' + clinic_info + 'FROM Specialization ' +
            'inner join Specilizations on Specilizations.specializtion_id=Specialization.id ' +
            'inner join Clinic on Clinic.id=Specilizations.clinic_id ' +
            'inner join Location on Location.id=Clinic.location ' +
            'inner join District on District.id=Location.district_id';
        }
        if (specializationId && distirctId) {
            sqlRequest += ' where Specialization.id =' + specializationId + ' and District.id=' + distirctId;
        } else {
            if (specializationId || distirctId) {
                sqlRequest += ' where ';
                if (specializationId) {
                    sqlRequest += 'Specialization.id =' + specializationId;
                }
                else {
                    sqlRequest += 'District.id=' + distirctId;
                }
            }
        }
        if (numPage == 1)
            sqlRequest += ' limit 0,20';
        else {
            if (numPage > 1)
                sqlRequest += ' limit ' + num + ',20';
        }
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });

        console.log("finish get clinic_info with district, services option");

    });
restapi.route('/clinics_services_rating')
    .get(function (req, res) {
        console.log("start get start get clinic_info with rating, services option");
        var page = 1;
        var specializationId;
        if (res.req.query.specialization_id)
            specializationId = res.req.query.specialization_id;
        var rating;
        if (res.req.query.rating_id)
            rating = res.req.query.rating_id;
        if (res.req.query.num_page)
            page = res.req.query.num_page;
        var num = 20 * page;
        if (!specializationId && (!rating))
            var sqlRequest = 'SELECT' + clinic_info + 'FROM Clinic ';
        else {
            var sqlRequest = 'SELECT' + clinic_info + 'FROM Specialization ' +
                'inner join Specilizations on Specilizations.specializtion_id=Specialization.id ' +
                'inner join Clinic on Clinic.id=Specilizations.clinic_id ' +
                'inner join Location on Location.id=Clinic.location ' +
                'inner join District on District.id=Location.district_id';
        }
        if (specializationId && rating) {
            sqlRequest += ' where Specialization.id =' + specializationId + ' and Clinic.rating>' + rating;
        } else {
            if (specializationId || rating) {
                sqlRequest += ' where ';
                if (specializationId) {
                    sqlRequest += 'Specialization.id =' + specializationId;
                }
                else {
                    sqlRequest += 'Clinic.rating>' + rating;
                }
            }
        }
        if (numPage == 1)
            sqlRequest += ' limit 0,20';
        else {
            if (numPage > 1)
                sqlRequest += ' limit ' + num + ',20';
        }
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });

        console.log("finish get start get clinic_info with rating, services option");

    });
restapi.route('/clinics_metro_name')
    .get(function (req, res) {
        console.log("start get start get clinic_info with metro_name option");
        var page = 1;
        var metroId;
        if (res.req.query.num_page)
            page = res.req.query.num_page;
        var num = 20 * page;
        if (res.req.query.metro_id)
            metroId = res.req.query.metro_id;
        if (!metroId)
            var sqlRequest = 'SELECT' + clinic_info + 'FROM Clinic ';
        else {
            var sqlRequest = 'SELECT' + clinic_info + 'FROM Metro Inner Join Location on Location.metro_id=Metro.id ' +
                'Inner Join Clinic on Clinic.location=Location.id ' +
                'where Metro.id=' + metroId;
        }
        if (numPage == 1)
            sqlRequest += ' limit 0,20';
        else {
            if (numPage > 1)
                sqlRequest += ' limit ' + num + ',20';
        }
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });
        console.log("finish get start get clinic_info with metro_name option");
    });
restapi.route('/services')
    .get(function (req, res) {
        console.log("start get services from spicialization")
        var sqlRequest = 'select * from Specialization';
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });
        console.log("finish get services")
    });
restapi.route('/districts')
    .get(function (req, res) {
        console.log("start get district")
        var sqlRequest = 'select * from District';
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });
        console.log("finish get district")
    });
restapi.route('/metro')
    .get(function (req, res) {
        console.log("start get metro_info")
        var sqlRequest = 'select * from Metro';
        db.all(sqlRequest, function (err, row) {
            res.json({"data": row})
        });
        console.log("finish get metro_info")
    });
restapi.route('*')
    .get(function (req, res) {
        var error = {};
        error.messege = "Route not found";
        res.json(error)
    });

restapi.listen(3000);
