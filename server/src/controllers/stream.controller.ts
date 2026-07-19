import { Request, Response } from "express";
import streamService from "../services/stream.service";
import { fetchClerkUser } from "../utils/clerkUser";

class StreamController {
  // POST /stream/token
  async generateToken(req: Request, res: Response): Promise<void> {
    try {
      const { clerkUserId } = req.auth!;

      // Fetch the latest profile directly from Clerk (source of truth).
      // This ensures Stream always reflects the most up-to-date username and
      // profile image, even if the user just changed them in Clerk.
      const clerkUser = await fetchClerkUser(clerkUserId);

      // Upsert Stream user with fresh Clerk data and generate a new token.
      const streamToken = await streamService.syncAndGenerateToken(
        clerkUser.clerkId,
        clerkUser.username,
        clerkUser.imageUrl
      );

      res.status(200).json({ success: true, streamToken });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // POST /stream/channel
  async createChannel(req: Request, res: Response): Promise<void> {
    try {
      const { channelId, members } = req.body;

      const channel = await streamService.createChannel(channelId, members);

      res.status(201).json({ success: true, message: "Channel created.", data: { channel } });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // GET /stream/channel/:id
  async getChannel(req: Request, res: Response): Promise<void> {
    try {
      const channel = await streamService.getChannel(req.params.id);

      res.status(200).json({ success: true, message: "Channel fetched.", data: { channel } });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // DELETE /stream/channel/:id
  async deleteChannel(req: Request, res: Response): Promise<void> {
    try {
      await streamService.deleteChannel(req.params.id);

      res.status(200).json({ success: true, message: "Channel deleted.", data: null });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
}

export default new StreamController();
