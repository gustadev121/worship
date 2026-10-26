import type { Label } from "../domain/label";
import type { RoleAssignment, RoleType } from "../domain/role-assignment";
import type { Song } from "../domain/song";
import type { User, UserRole } from "../domain/user";

export interface SessionPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsernameOrEmail(identifier: string): Promise<User | null>;
  list(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface SongFilter {
  query?: string;
  labelIds?: string[];
  practiceKey?: string;
  memberId?: string;
  roleType?: RoleType;
}

export interface ISongRepository {
  findById(id: string): Promise<Song | null>;
  list(filter: SongFilter): Promise<Song[]>;
  create(song: Song): Promise<Song>;
  update(song: Song): Promise<Song>;
  delete(id: string): Promise<void>;
}

export interface IRoleAssignmentRepository {
  findById(id: string): Promise<RoleAssignment | null>;
  listBySong(songId: string): Promise<RoleAssignment[]>;
  listByUser(userId: string): Promise<RoleAssignment[]>;
  create(assignment: RoleAssignment): Promise<RoleAssignment>;
  update(assignment: RoleAssignment): Promise<RoleAssignment>;
  delete(id: string): Promise<void>;
}

export interface ILabelRepository {
  list(): Promise<Label[]>;
  findById(id: string): Promise<Label | null>;
  findBySlug(slug: string): Promise<Label | null>;
  create(label: Label): Promise<Label>;
  update(label: Label): Promise<Label>;
  delete(id: string): Promise<void>;
  setSongLabels(songId: string, labelIds: string[]): Promise<void>;
  getSongLabelIds(songId: string): Promise<string[]>;
}

export interface IPasswordHasherPort {
  hash(password: string): Promise<{ hash: string }>;
  verify(password: string, stored: string): Promise<boolean>;
}

export interface ITokenServicePort {
  sign(payload: SessionPayload): Promise<string>;
  verify(token: string): Promise<SessionPayload>;
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface IYouTubeProviderPort {
  search(query: string, maxResults?: number): Promise<YouTubeResult[]>;
}
