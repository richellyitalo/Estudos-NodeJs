const { Rental, validate } = require('../models/rental');
const { Customer } = require('../models/customer');
const { Movie } = require('../models/movie');
const mongoose = require('mongoose');
const Fawn = require('fawn');

Fawn.init(mongoose);

const router = require('express').Router();

router.get('/', async (req, res) => {
  const rentals = await Rental.find();

  res.send(rentals); 
});

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const customer = await Customer.findById(req.body.customerId);
  if (!customer) {
    return res.status(400).send('Cliente não encontrado');
  }

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) {
    return res.status(400).send('Filme não encontrado');
  }

  let rental = new Rental({
    customer: {
      _id: customer._id,
      name: customer.name, 
      phone: customer.phone
    },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate
    }
  });

  // rental = await rental.save();

  // movie.numberInStock--;
  // movie.save();
  // Transactions com Fawn (realizandos os mesmos comandos acima)
  try {
    new Fawn.Task()
      .save('rentals', rental)
      .update('movies', { _id: movie._id} , {
        $inc: {
          numberInStock: -1
        }
      })
      .run();
  } catch (ex) {
    console.log(ex);
    return res.status(500).send('Algo deu errado');
  }

  res.send(rental);
});

module.exports = router;