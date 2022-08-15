import { Date } from 'mongoose';
import { Lang } from 'src/index.interface';

export interface IMovie {
  _id: string;
  name: {
    [Lang.EN]: string;
    [Lang.TC]: string;
  };
  genres: {
    [Lang.EN]: string[];
    [Lang.TC]: string[];
  };
  synopsis: {
    [Lang.EN]: string;
    [Lang.TC]: string;
  };
  directors: {
    [Lang.EN]: string[];
    [Lang.TC]: string[];
  };
  actors: {
    [Lang.EN]: string[];
    [Lang.TC]: string[];
  };
  releaseDate: string;
  runningTimeMins: number;
  aggregateRating: number;
  category: string;
  archived: boolean;
  lastUpdated?: Date;
}

export type MovieNameType = IMovie['name'];

export interface IMovieBriefInfo {
  [key: string]: MovieNameType;
}

export interface IMovieDataHttpConfig {
  headers: {
    [key: string]: string;
  };
}

export interface IName2Id {
  _id: string;
  movieId: string;
}
