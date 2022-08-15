import mongoose from 'mongoose';
import { Lang } from '../../../index.interface';
import { IMovie } from 'src/services/movie/movie.interface';

const movieSchema = new mongoose.Schema<IMovie>({
  _id: String,
  name: {
    [Lang.EN]: {
      type: String,
      required: true,
    },
    [Lang.TC]: {
      type: String,
      required: true,
    },
  },
  genres: {
    [Lang.TC]: {
      type: [String],
      required: true,
    },
    [Lang.EN]: {
      type: [String],
      required: true,
    },
  },
  synopsis: {
    [Lang.TC]: {
      type: String,
    },
    [Lang.EN]: {
      type: String,
    },
  },
  directors: {
    [Lang.TC]: {
      type: [String],
      required: true,
    },
    [Lang.EN]: {
      type: [String],
      required: true,
    },
  },
  actors: {
    [Lang.TC]: {
      type: [String],
      required: true,
    },
    [Lang.EN]: {
      type: [String],
      required: true,
    },
  },
  releaseDate: {
    type: String,
    required: true,
  },
  runningTimeMins: {
    type: Number,
    required: true,
  },
  aggregateRating: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  archived: {
    type: Boolean,
    required: true,
  },
  lastUpdated: {
    type: String,
    default: new Date().toISOString(),
  },
});

export const MovieModel = mongoose.model<IMovie>('Movie', movieSchema);
