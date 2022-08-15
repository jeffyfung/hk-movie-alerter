import axios from 'axios';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import { IMovieDataHttpConfig, IMovie, IMovieBriefInfo } from './movie.interface';
import { Lang } from '../../index.interface';
import { ElementType } from '../../../node_modules/domelementtype/lib';
import { HydratedDocument } from 'mongoose';
import { MovieModel } from '../../utils/database/schemas/movie.schema';

const HTTP_CONFIG: { [key in Lang]: IMovieDataHttpConfig } = {
  [Lang.TC]: { headers: { Cookie: 'lang=zhHK' } },
  [Lang.EN]: { headers: { Cookie: 'lang=enGB' } },
};

// const defaultMovieName = {
//   [Lang.EN]: 'Name not provided',
//   [Lang.TC]: '未有提供電影名稱',
// };

// const defaultSynopsisContent = {
//   [Lang.EN]: 'Synopsis not provided',
//   [Lang.TC]: '未有提供電影簡介',
// };

async function getMovieBriefInfo(): Promise<IMovieBriefInfo> {
  if (!process.env.MOVIE6_COMING_URL || !process.env.MOVIE6_SHOWING_URL) {
    throw new Error('Error: Movie6 urls not provided');
  }
  const [comingMovieBriefInfo, showingMovieBriefInfo] = await Promise.all([
    parseMovieBriefInfo(process.env.MOVIE6_COMING_URL),
    parseMovieBriefInfo(process.env.MOVIE6_SHOWING_URL),
  ]);
  return Object.assign(comingMovieBriefInfo, showingMovieBriefInfo);
}

async function parseMovieBriefInfo(url: string): Promise<IMovieBriefInfo> {
  const movieBriefInfo: IMovieBriefInfo = {};
  for (let lang of Object.values(Lang)) {
    const { data } = await axios.get(url, HTTP_CONFIG[lang]);
    const $ = cheerio.load(data);
    $('.shows > a').each((_i, elem) => {
      const _id: string = elem.attribs['href'].substring(7);
      const _dataNode = $('.name', elem)[0].children[0];
      if (_dataNode.type !== ElementType.Text) {
        throw new Error('movie name cannot be located from script');
      }
      const _name = _dataNode.data.trim();
      if (!movieBriefInfo[_id]) {
        movieBriefInfo[_id] = {
          [Lang.EN]: '',
          [Lang.TC]: '',
        };
      }
      movieBriefInfo[_id][lang] = _name;
    });
  }
  return movieBriefInfo;
}

async function getMovieDetails(movieBriefInfo: IMovieBriefInfo): Promise<void> {
  const queue = new PQueue({ concurrency: 8 });
  const movieDetailsDocs: Array<HydratedDocument<IMovie>> = [];

  const _updateDetails = async (id: string): Promise<void> => {
    console.log(`looking into ${id}`);
    let doc: IMovie;
    let obj = await MovieModel.findById<IMovie>(id).exec();

    if (obj === null) {
      const _obj = await MovieModel.findOne<IMovie>({
        name: { [Lang.EN]: movieBriefInfo[id][Lang.EN] },
      }).exec();
      doc = _obj !== null ? _obj : initMovieDoc(id);
    } else {
      doc = obj;
    }
    doc = await parseMovieDetails(doc, id, Lang.EN, true);
    doc = await parseMovieDetails(doc, id, Lang.TC, false);
    // doc.archived = false;
    doc.archived = null as unknown as boolean;
    movieDetailsDocs.push(new MovieModel<IMovie>(doc));
  };

  await Promise.all(Object.keys(movieBriefInfo).map((id) => queue.add(() => _updateDetails(id))));
  await MovieModel.bulkSave(movieDetailsDocs);
}

function initMovieDoc(id: string): IMovie {
  return {
    _id: id,
    name: {
      [Lang.EN]: '',
      [Lang.TC]: '',
    },
    genres: {
      [Lang.EN]: [],
      [Lang.TC]: [],
    },
    synopsis: {
      [Lang.EN]: '',
      [Lang.TC]: '',
    },
    directors: {
      [Lang.EN]: [],
      [Lang.TC]: [],
    },
    actors: {
      [Lang.EN]: [],
      [Lang.TC]: [],
    },
    releaseDate: '',
    runningTimeMins: -1,
    aggregateRating: -1,
    category: '',
    archived: false,
  };
}

async function parseMovieDetails(
  doc: IMovie,
  id: string,
  lang: Lang,
  langAgnosticFields: boolean
): Promise<IMovie> {
  const url = `${process.env.MOVIE6_DOMAIN}/movie/${id}`;
  const { data } = await axios.get(url, HTTP_CONFIG[lang]);
  const $ = cheerio.load(data);

  const mainWrapper = $('.mainWrapper');
  const dataNode = $('script[type=application/ld+json]')[0].children[0];
  if (dataNode.type !== ElementType.Text) {
    throw new Error('ssr data cannot be located from script');
  }

  const movieData = JSON.parse(dataNode.data);
  if (movieData['@type'] !== 'Movie') {
    throw new Error(
      `movieData is not of type 'Movie': ${movieData['@id']} + ${movieData['@type']} + ${movieData['about']}`
    );
  }
  doc.name = { ...doc.name, [lang]: movieData.name };
  doc.genres = { ...doc.genres, [lang]: getTextsFromElement(mainWrapper, '.genre') };
  doc.synopsis = { ...doc.synopsis, [lang]: movieData.about };
  doc.directors = { ...doc.directors, [lang]: movieData.director };
  doc.actors = { ...doc.actors, [lang]: movieData.actor };

  if (langAgnosticFields) {
    doc.category = getTextsFromElement(mainWrapper, '.movieMobileDetail .dateDuration .cat')[0];
    doc.releaseDate = movieData.datePublished;
    doc.runningTimeMins = movieData.duration.match(/\d+/)[0];
    doc.aggregateRating = movieData.aggregateRating?.ratingValue || -1;
  }

  return doc;
}

function getTextsFromElement(
  context: cheerio.Cheerio<cheerio.Element>,
  selector: string
): string[] {
  if (!context.find(selector).length) {
    return [];
  }
  const nodes = context.find(selector)[0].children;
  const texts = [];
  for (let node of nodes) {
    if (node.type !== ElementType.Text) {
      continue;
    }
    texts.push(node.data.trim());
  }
  return texts;
}

async function handleDataExpiry(movieBriefInfo: IMovieBriefInfo): Promise<void> {
  await MovieModel.deleteMany({ archived: true }).exec();
  await MovieModel.updateMany(
    { _id: { $nin: Object.keys(movieBriefInfo) } },
    { archived: true }
  ).exec();
}

export { getMovieBriefInfo, getMovieDetails, handleDataExpiry };
