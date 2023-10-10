const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const moment = require('moment');

//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

const moviesController = {
    list: (req, res) => {
        db.Movie.findAll({
            include: ['genre'],
        }).then((movies) => {
            // return res.send(movies);
            res.render('moviesList.ejs', { movies, moment });
        });
    },
    detail: (req, res) => {
        db.Movie.findByPk(req.params.id, {
            include: ['genre'],
        }).then((movie) => {
            return res.render('moviesDetail.ejs', {
                ...movie.dataValues,
                moment,
            });
        });
    },
    new: (req, res) => {
        db.Movie.findAll({
            order: [['release_date', 'DESC']],
            limit: 5,
        }).then((movies) => {
            res.render('newestMovies', { movies });
        });
    },
    recomended: (req, res) => {
        db.Movie.findAll({
            where: {
                rating: { [db.Sequelize.Op.gte]: 8 },
            },
            order: [['rating', 'DESC']],
        }).then((movies) => {
            res.render('recommendedMovies.ejs', { movies });
        });
    },

    // Rutas para trabajar con el CRUD

    add: function (req, res) {
        db.Genre.findAll({
            order: ['name'],
        })
            .then((genres) => {
                return res.render('moviesAdd', {
                    genres,
                });
            })
            .catch((error) => console.log(error));
    },
    create: function (req, res) {
        const { title, rating, awards, release_date, length, genre_id } =
            req.body;

        db.Movie.create({
            title: title.trim(),
            rating,
            awards,
            release_date,
            length,
            genre_id,
        })
            .then(() => {
                return res.redirect('/movies');
            })
            .catch((error) => console.log(error));
    },
    edit: function (req, res) {
        const genres = db.Genre.findAll({
            order: ['name'],
        });
        const movie = db.Movie.findByPk(req.params.id, {
            include: ['actors'],
        });
        const actors = db.Actor.findAll({
            order: [
                ['first_name', 'ASC'],
                ['last_name', 'ASC'],
            ],
        });

        Promise.all([genres, movie, actors])
            .then(([genres, movie, actors]) => {
                // return res.send(movie)
                return res.render('moviesEdit', {
                    genres,
                    Movie: movie,
                    actors,
                    moment,
                });
            })
            .catch((error) => console.log(error));
    },
    update: function (req, res) {
        let {
            title,
            rating,
            awards,
            release_date,
            length,
            genre_id,
            actors,
        } = req.body;
        actors = typeof actors === 'string' ? [actors] : actors;

        db.Movie.update(
            {
                title: title.trim(),
                rating,
                awards,
                release_date,
                length,
                genre_id,
            },
            {
                where: {
                    id: req.params.id,
                },
            }
        )
            .then(() => {
                db.Actor_Movie.destroy({
                    where: {
                        movie_id: req.params.id,
                    },
                }).then(() => {
                    if (actors) {
                        const actorsDB = actors.map((actor) => {
                            return {
                                movie_id: req.params.id,
                                actor_id: actor,
                            }
                        })

                        db.Actor_Movie.bulkCreate(actorsDB, {
                            validate: true,
                        }).then(() =>
                            console.log('actores agregados correctamente')
                        );
                    }
                });
            })
            .catch((error) => console.log(error))
            .finally(() => res.redirect('/movies'));
    },
    delete: function (req, res) {},
    destroy: function (req, res) {},
};

module.exports = moviesController;
