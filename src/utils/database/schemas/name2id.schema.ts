import mongoose from 'mongoose';
import { Lang } from '../../../index.interface';
import { IName2Id } from 'src/services/movie/movie.interface';

const name2IdSchema = new mongoose.Schema<IName2Id>({
  _id: String,
  movieId: {
    type: String,
    required: true,
  },
});

export const Name2IdModel = {
  [Lang.EN]: mongoose.model<IName2Id>('EnName2IdSchema', name2IdSchema),
  [Lang.TC]: mongoose.model<IName2Id>('TcName2IdSchema', name2IdSchema),
};
