import mongoose from "mongoose";
import { IBlog } from "./blog.interface";

const blogPostSchema = new mongoose.Schema<IBlog>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: String, required: true, ref: 'User' },
    featuredImage: { type: String },
    tags: [String],
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Blog = mongoose.model<IBlog>('Blog', blogPostSchema);
export default Blog;