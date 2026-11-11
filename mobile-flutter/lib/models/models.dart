/// نماذج البيانات الأساسية لتطبيق ثقافتنا
/// جميع النماذج تدعم fromJson و toJson و copyWith
library;

// ===== Chapter =====
class ChapterModel {
  final int id;
  final String title;
  final String icon;
  final String description;
  final String? color;
  final int order;
  final bool isPublished;
  final int? levelsCount;

  const ChapterModel({
    required this.id,
    required this.title,
    this.icon = '⭐',
    this.description = '',
    this.color,
    this.order = 0,
    this.isPublished = true,
    this.levelsCount,
  });

  factory ChapterModel.fromJson(Map<String, dynamic> json) => ChapterModel(
        id: _parseInt(json['id'] ?? json['_id']),
        title: json['title'] ?? json['name'] ?? 'فصل',
        icon: json['icon'] ?? json['emoji'] ?? '⭐',
        description: json['description'] ?? '',
        color: json['color'],
        order: _parseInt(json['order'] ?? 0),
        isPublished: json['isPublished'] ?? true,
        levelsCount: json['levelsCount'] != null ? _parseInt(json['levelsCount']) : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'icon': icon,
        'description': description,
        'color': color,
        'order': order,
        'isPublished': isPublished,
        'levelsCount': levelsCount,
      };

  ChapterModel copyWith({
    int? id,
    String? title,
    String? icon,
    String? description,
    String? color,
    int? order,
    bool? isPublished,
    int? levelsCount,
  }) =>
      ChapterModel(
        id: id ?? this.id,
        title: title ?? this.title,
        icon: icon ?? this.icon,
        description: description ?? this.description,
        color: color ?? this.color,
        order: order ?? this.order,
        isPublished: isPublished ?? this.isPublished,
        levelsCount: levelsCount ?? this.levelsCount,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is ChapterModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Word =====
class WordModel {
  final int? id;
  final int? levelId;
  final String text;
  final String clue;
  final String? category;
  final String direction; // 'across' or 'down'
  final int? startRow;
  final int? startCol;
  final int? number;
  final List<String> options;
  final int? correctOption;
  final List<String> matchPairs;
  final String? emojis;
  final String? imageUrl;

  const WordModel({
    this.id,
    this.levelId,
    required this.text,
    this.clue = '',
    this.category,
    this.direction = 'across',
    this.startRow,
    this.startCol,
    this.number,
    this.options = const [],
    this.correctOption,
    this.matchPairs = const [],
    this.emojis,
    this.imageUrl,
  });

  factory WordModel.fromJson(Map<String, dynamic> json) => WordModel(
        id: json['id'] != null ? _parseInt(json['id']) : null,
        levelId: json['levelId'] != null ? _parseInt(json['levelId']) : null,
        text: json['text'] ?? json['word'] ?? '',
        clue: json['clue'] ?? '',
        category: json['category'],
        direction: json['direction'] ?? 'across',
        startRow: json['startRow'] != null ? _parseInt(json['startRow']) : null,
        startCol: json['startCol'] != null ? _parseInt(json['startCol']) : null,
        number: json['number'] != null ? _parseInt(json['number']) : (json['num'] != null ? _parseInt(json['num']) : null),
        options: _parseStringList(json['options']),
        correctOption: json['correctOption'] != null ? _parseInt(json['correctOption']) : null,
        matchPairs: _parseStringList(json['matchPairs']),
        emojis: json['emojis'],
        imageUrl: json['imageUrl'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'levelId': levelId,
        'text': text,
        'clue': clue,
        'category': category,
        'direction': direction,
        'startRow': startRow,
        'startCol': startCol,
        'number': number,
        'options': options,
        'correctOption': correctOption,
        'matchPairs': matchPairs,
        'emojis': emojis,
        'imageUrl': imageUrl,
      };

  bool get isAcross => direction == 'across';
  bool get isDown => direction == 'down';

  WordModel copyWith({
    int? id,
    int? levelId,
    String? text,
    String? clue,
    String? category,
    String? direction,
    int? startRow,
    int? startCol,
    int? number,
    List<String>? options,
    int? correctOption,
    List<String>? matchPairs,
    String? emojis,
    String? imageUrl,
  }) =>
      WordModel(
        id: id ?? this.id,
        levelId: levelId ?? this.levelId,
        text: text ?? this.text,
        clue: clue ?? this.clue,
        category: category ?? this.category,
        direction: direction ?? this.direction,
        startRow: startRow ?? this.startRow,
        startCol: startCol ?? this.startCol,
        number: number ?? this.number,
        options: options ?? this.options,
        correctOption: correctOption ?? this.correctOption,
        matchPairs: matchPairs ?? this.matchPairs,
        emojis: emojis ?? this.emojis,
        imageUrl: imageUrl ?? this.imageUrl,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is WordModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Cell (مسطحة من الـ API) =====
class CellModel {
  final int? id;
  final int? levelId;
  final int row;
  final int col;
  final String letter;
  final int? number;

  const CellModel({
    this.id,
    this.levelId,
    required this.row,
    required this.col,
    this.letter = '',
    this.number,
  });

  factory CellModel.fromJson(Map<String, dynamic> json) => CellModel(
        id: json['id'] != null ? _parseInt(json['id']) : null,
        levelId: json['levelId'] != null ? _parseInt(json['levelId']) : null,
        row: _parseInt(json['row']),
        col: _parseInt(json['col']),
        letter: json['letter'] ?? '',
        number: json['number'] != null ? _parseInt(json['number']) : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'levelId': levelId,
        'row': row,
        'col': col,
        'letter': letter,
        'number': number,
      };

  CellModel copyWith({
    int? id,
    int? levelId,
    int? row,
    int? col,
    String? letter,
    int? number,
  }) =>
      CellModel(
        id: id ?? this.id,
        levelId: levelId ?? this.levelId,
        row: row ?? this.row,
        col: col ?? this.col,
        letter: letter ?? this.letter,
        number: number ?? this.number,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is CellModel && other.row == row && other.col == col);

  @override
  int get hashCode => Object.hash(row, col);
}

// ===== Level =====
class LevelModel {
  final int id;
  final int chapterId;
  final int number;
  final String title;
  final String difficulty;
  final String? puzzleType;
  final String? gameMode;
  final int reward;
  final int hintCost;
  final int gridSizeRows;
  final int gridSizeCols;
  final List<String> availableLetters;
  final List<String> bonusWords;
  final List<WordModel> words;
  final List<CellModel> cells;
  final bool isPublished;
  final String status;

  const LevelModel({
    required this.id,
    required this.chapterId,
    this.number = 1,
    this.title = 'مرحلة',
    this.difficulty = 'easy',
    this.puzzleType,
    this.gameMode,
    this.reward = 50,
    this.hintCost = 10,
    this.gridSizeRows = 0,
    this.gridSizeCols = 0,
    this.availableLetters = const [],
    this.bonusWords = const [],
    this.words = const [],
    this.cells = const [],
    this.isPublished = true,
    this.status = 'published',
  });

  factory LevelModel.fromJson(Map<String, dynamic> json) => LevelModel(
        id: _parseInt(json['id'] ?? json['_id']),
        chapterId: _parseInt(json['chapterId']),
        number: _parseInt(json['number'] ?? 1),
        title: json['title'] ?? json['name'] ?? 'مرحلة',
        difficulty: json['difficulty'] ?? 'easy',
        puzzleType: json['puzzleType'],
        gameMode: json['gameMode'],
        reward: _parseInt(json['reward'] ?? 50),
        hintCost: _parseInt(json['hintCost'] ?? 10),
        gridSizeRows: _parseInt(json['gridSizeRows'] ?? json['rows'] ?? 0),
        gridSizeCols: _parseInt(json['gridSizeCols'] ?? json['cols'] ?? 0),
        availableLetters: _parseStringList(json['availableLetters']),
        bonusWords: _parseStringList(json['bonusWords']),
        words: _parseWordList(json['words']),
        cells: _parseCellList(json['cells']),
        isPublished: json['isPublished'] ?? true,
        status: json['status'] ?? 'published',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'chapterId': chapterId,
        'number': number,
        'title': title,
        'difficulty': difficulty,
        'puzzleType': puzzleType,
        'gameMode': gameMode,
        'reward': reward,
        'hintCost': hintCost,
        'gridSizeRows': gridSizeRows,
        'gridSizeCols': gridSizeCols,
        'availableLetters': availableLetters,
        'bonusWords': bonusWords,
        'words': words.map((w) => w.toJson()).toList(),
        'cells': cells.map((c) => c.toJson()).toList(),
        'isPublished': isPublished,
        'status': status,
      );

  /// تطبيع الخلايا: تحويل المصفوفة المسطحة إلى شبكة ثنائية الأبعاد
  /// [[{letter, num}|null, ...], ...]
  List<List<Map<String, dynamic>?>> get normalizedCells {
    if (cells.isEmpty) {
      return List.generate(
        gridSizeRows,
        (_) => List.generate(gridSizeCols, (_) => null),
      );
    }
    // إن كانت الخلايا بالفعل شبكة ثنائية الأبعاد (نادرة)
    if (cells[0].row == 0 && cells.length > 1 && cells[0].col > 0) {
      // حالة غير عادية، نعالجها بالطريقة القياسية
    }
    final maxRow = cells.fold<int>(0, (m, c) => c.row > m ? c.row : m);
    final maxCol = cells.fold<int>(0, (m, c) => c.col > m ? c.col : m);
    final rows = maxRow + 1;
    final cols = maxCol + 1;
    final grid = List.generate(
      rows,
      (_) => List.generate(cols, (_) => null as Map<String, dynamic>?),
    );
    for (final c in cells) {
      grid[c.row][c.col] = {
        'letter': c.letter,
        'num': c.number,
      };
    }
    return grid;
  }

  /// تطبيع الكلمات: ضمان وجود word و num
  List<WordModel> get normalizedWords => words
      .map((w) => w.copyWith(
            text: w.text,
            number: w.number,
          ))
      .toList();

  List<WordModel> get acrossWords =>
      normalizedWords.where((w) => w.direction == 'across').toList();

  List<WordModel> get downWords =>
      normalizedWords.where((w) => w.direction == 'down').toList();

  LevelModel copyWith({
    int? id,
    int? chapterId,
    int? number,
    String? title,
    String? difficulty,
    String? puzzleType,
    String? gameMode,
    int? reward,
    int? hintCost,
    int? gridSizeRows,
    int? gridSizeCols,
    List<String>? availableLetters,
    List<String>? bonusWords,
    List<WordModel>? words,
    List<CellModel>? cells,
    bool? isPublished,
    String? status,
  }) =>
      LevelModel(
        id: id ?? this.id,
        chapterId: chapterId ?? this.chapterId,
        number: number ?? this.number,
        title: title ?? this.title,
        difficulty: difficulty ?? this.difficulty,
        puzzleType: puzzleType ?? this.puzzleType,
        gameMode: gameMode ?? this.gameMode,
        reward: reward ?? this.reward,
        hintCost: hintCost ?? this.hintCost,
        gridSizeRows: gridSizeRows ?? this.gridSizeRows,
        gridSizeCols: gridSizeCols ?? this.gridSizeCols,
        availableLetters: availableLetters ?? this.availableLetters,
        bonusWords: bonusWords ?? this.bonusWords,
        words: words ?? this.words,
        cells: cells ?? this.cells,
        isPublished: isPublished ?? this.isPublished,
        status: status ?? this.status,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is LevelModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Book =====
class BookModel {
  final int id;
  final String title;
  final String author;
  final String? category;
  final String description;
  final int pages;
  final int? year;
  final bool isFeatured;
  final double? rating;
  final int ratingCount;
  final String contentType;
  final int readingTimeMin;
  final int views;
  final String difficulty;
  final String? coverImage;
  final String? pdfUrl;

  const BookModel({
    required this.id,
    required this.title,
    this.author = 'غير معروف',
    this.category,
    this.description = '',
    this.pages = 0,
    this.year,
    this.isFeatured = false,
    this.rating,
    this.ratingCount = 0,
    this.contentType = 'pdf',
    this.readingTimeMin = 0,
    this.views = 0,
    this.difficulty = 'medium',
    this.coverImage,
    this.pdfUrl,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) => BookModel(
        id: _parseInt(json['id'] ?? json['_id']),
        title: json['title'] ?? '',
        author: json['author'] ?? 'غير معروف',
        category: json['category'],
        description: json['description'] ?? '',
        pages: _parseInt(json['pages'] ?? 0),
        year: json['year'] != null ? _parseInt(json['year']) : null,
        isFeatured: json['isFeatured'] ?? false,
        rating: json['rating'] != null ? _parseDouble(json['rating']) : null,
        ratingCount: _parseInt(json['ratingCount'] ?? 0),
        contentType: json['contentType'] ?? 'pdf',
        readingTimeMin: _parseInt(json['readingTimeMin'] ?? 0),
        views: _parseInt(json['views'] ?? 0),
        difficulty: json['difficulty'] ?? 'medium',
        coverImage: json['coverImage'] ?? json['cover'],
        pdfUrl: json['pdfUrl'] ?? json['pdf'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'author': author,
        'category': category,
        'description': description,
        'pages': pages,
        'year': year,
        'isFeatured': isFeatured,
        'rating': rating,
        'ratingCount': ratingCount,
        'contentType': contentType,
        'readingTimeMin': readingTimeMin,
        'views': views,
        'difficulty': difficulty,
        'coverImage': coverImage,
        'pdfUrl': pdfUrl,
      };

  BookModel copyWith({
    int? id,
    String? title,
    String? author,
    String? category,
    String? description,
    int? pages,
    int? year,
    bool? isFeatured,
    double? rating,
    int? ratingCount,
    String? contentType,
    int? readingTimeMin,
    int? views,
    String? difficulty,
    String? coverImage,
    String? pdfUrl,
  }) =>
      BookModel(
        id: id ?? this.id,
        title: title ?? this.title,
        author: author ?? this.author,
        category: category ?? this.category,
        description: description ?? this.description,
        pages: pages ?? this.pages,
        year: year ?? this.year,
        isFeatured: isFeatured ?? this.isFeatured,
        rating: rating ?? this.rating,
        ratingCount: ratingCount ?? this.ratingCount,
        contentType: contentType ?? this.contentType,
        readingTimeMin: readingTimeMin ?? this.readingTimeMin,
        views: views ?? this.views,
        difficulty: difficulty ?? this.difficulty,
        coverImage: coverImage ?? this.coverImage,
        pdfUrl: pdfUrl ?? this.pdfUrl,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is BookModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Notification =====
class NotificationModel {
  final int? id;
  final String title;
  final String body;
  final String type;
  final String? icon;
  final DateTime? createdAt;
  final bool isRead;
  final String? actionUrl;
  final int? reward;

  const NotificationModel({
    this.id,
    required this.title,
    required this.body,
    this.type = 'info',
    this.icon,
    this.createdAt,
    this.isRead = false,
    this.actionUrl,
    this.reward,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: json['id'] != null ? _parseInt(json['id']) : null,
        title: json['title'] ?? '',
        body: json['body'] ?? json['message'] ?? '',
        type: json['type'] ?? 'info',
        icon: json['icon'],
        createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
        isRead: json['isRead'] ?? false,
        actionUrl: json['actionUrl'],
        reward: json['reward'] != null ? _parseInt(json['reward']) : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'type': type,
        'icon': icon,
        'createdAt': createdAt?.toIso8601String(),
        'isRead': isRead,
        'actionUrl': actionUrl,
        'reward': reward,
      };

  NotificationModel copyWith({
    int? id,
    String? title,
    String? body,
    String? type,
    String? icon,
    DateTime? createdAt,
    bool? isRead,
    String? actionUrl,
    int? reward,
  }) =>
      NotificationModel(
        id: id ?? this.id,
        title: title ?? this.title,
        body: body ?? this.body,
        type: type ?? this.type,
        icon: icon ?? this.icon,
        createdAt: createdAt ?? this.createdAt,
        isRead: isRead ?? this.isRead,
        actionUrl: actionUrl ?? this.actionUrl,
        reward: reward ?? this.reward,
      );

  String get iconOrEmoji => icon ?? _defaultIconForType(type);

  static String _defaultIconForType(String type) {
    switch (type) {
      case 'reward':
        return '🎁';
      case 'achievement':
        return '🏆';
      case 'book':
        return '📚';
      case 'challenge':
        return '🎯';
      case 'streak':
        return '⚡';
      case 'info':
      default:
        return '🔔';
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is NotificationModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== User =====
class UserModel {
  final String id;
  final String name;
  final String? email;
  final int level;
  final int xp;
  final int coins;
  final int dailyStreak;
  final int totalStars;
  final int completedLevelsCount;
  final int booksReadCount;
  final List<String> badges;
  final String? avatarUrl;

  const UserModel({
    required this.id,
    required this.name,
    this.email,
    this.level = 1,
    this.xp = 0,
    this.coins = 0,
    this.dailyStreak = 0,
    this.totalStars = 0,
    this.completedLevelsCount = 0,
    this.booksReadCount = 0,
    this.badges = const [],
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id']?.toString() ?? json['_id']?.toString() ?? 'guest',
        name: json['name'] ?? json['username'] ?? json['displayName'] ?? 'ضيف',
        email: json['email'],
        level: _parseInt(json['level'] ?? 1),
        xp: _parseInt(json['xp'] ?? 0),
        coins: _parseInt(json['coins'] ?? 0),
        dailyStreak: _parseInt(json['dailyStreak'] ?? 0),
        totalStars: _parseInt(json['totalStars'] ?? 0),
        completedLevelsCount: _parseInt(json['completedLevelsCount'] ?? 0),
        booksReadCount: _parseInt(json['booksReadCount'] ?? 0),
        badges: _parseStringList(json['badges']),
        avatarUrl: json['avatarUrl'] ?? json['avatar'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'level': level,
        'xp': xp,
        'coins': coins,
        'dailyStreak': dailyStreak,
        'totalStars': totalStars,
        'completedLevelsCount': completedLevelsCount,
        'booksReadCount': booksReadCount,
        'badges': badges,
        'avatarUrl': avatarUrl,
      };

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    int? level,
    int? xp,
    int? coins,
    int? dailyStreak,
    int? totalStars,
    int? completedLevelsCount,
    int? booksReadCount,
    List<String>? badges,
    String? avatarUrl,
  }) =>
      UserModel(
        id: id ?? this.id,
        name: name ?? this.name,
        email: email ?? this.email,
        level: level ?? this.level,
        xp: xp ?? this.xp,
        coins: coins ?? this.coins,
        dailyStreak: dailyStreak ?? this.dailyStreak,
        totalStars: totalStars ?? this.totalStars,
        completedLevelsCount: completedLevelsCount ?? this.completedLevelsCount,
        booksReadCount: booksReadCount ?? this.booksReadCount,
        badges: badges ?? this.badges,
        avatarUrl: avatarUrl ?? this.avatarUrl,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is UserModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Leaderboard Entry =====
class LeaderboardEntryModel {
  final int rank;
  final String userId;
  final String name;
  final int score;
  final int xp;
  final int? level;
  final String? avatarUrl;

  const LeaderboardEntryModel({
    required this.rank,
    required this.userId,
    required this.name,
    this.score = 0,
    this.xp = 0,
    this.level,
    this.avatarUrl,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) => LeaderboardEntryModel(
        rank: _parseInt(json['rank'] ?? json['position'] ?? 0),
        userId: json['userId']?.toString() ?? json['id']?.toString() ?? '0',
        name: json['name'] ?? json['username'] ?? json['displayName'] ?? 'مستخدم',
        score: _parseInt(json['score'] ?? json['points'] ?? 0),
        xp: _parseInt(json['xp'] ?? 0),
        level: json['level'] != null ? _parseInt(json['level']) : null,
        avatarUrl: json['avatarUrl'] ?? json['avatar'],
      );

  Map<String, dynamic> toJson() => {
        'rank': rank,
        'userId': userId,
        'name': name,
        'score': score,
        'xp': xp,
        'level': level,
        'avatarUrl': avatarUrl,
      };

  LeaderboardEntryModel copyWith({
    int? rank,
    String? userId,
    String? name,
    int? score,
    int? xp,
    int? level,
    String? avatarUrl,
  }) =>
      LeaderboardEntryModel(
        rank: rank ?? this.rank,
        userId: userId ?? this.userId,
        name: name ?? this.name,
        score: score ?? this.score,
        xp: xp ?? this.xp,
        level: level ?? this.level,
        avatarUrl: avatarUrl ?? this.avatarUrl,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is LeaderboardEntryModel && other.userId == userId);

  @override
  int get hashCode => userId.hashCode;
}

// ===== AI Message =====
class AiMessageModel {
  final String id;
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final bool isTyping;

  const AiMessageModel({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.isTyping = false,
  });

  factory AiMessageModel.user(String content) => AiMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'user',
        content: content,
        timestamp: DateTime.now(),
      );

  factory AiMessageModel.assistant(String content) => AiMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'assistant',
        content: content,
        timestamp: DateTime.now(),
      );

  factory AiMessageModel.typing() => AiMessageModel(
        id: 'typing-${DateTime.now().millisecondsSinceEpoch}',
        role: 'assistant',
        content: '',
        timestamp: DateTime.now(),
        isTyping: true,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        'isTyping': isTyping,
      };

  factory AiMessageModel.fromJson(Map<String, dynamic> json) => AiMessageModel(
        id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        role: json['role'] ?? 'user',
        content: json['content'] ?? '',
        timestamp: json['timestamp'] != null
            ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
            : DateTime.now(),
        isTyping: json['isTyping'] ?? false,
      );

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';

  AiMessageModel copyWith({
    String? id,
    String? role,
    String? content,
    DateTime? timestamp,
    bool? isTyping,
  }) =>
      AiMessageModel(
        id: id ?? this.id,
        role: role ?? this.role,
        content: content ?? this.content,
        timestamp: timestamp ?? this.timestamp,
        isTyping: isTyping ?? this.isTyping,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is AiMessageModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Knowledge Node =====
class KnowledgeNodeModel {
  final String id;
  final String domain;
  final String name;
  final String description;
  final int level;
  final double mastery; // 0.0 - 1.0
  final String? parentId;
  final List<KnowledgeNodeModel> children;

  const KnowledgeNodeModel({
    required this.id,
    required this.domain,
    required this.name,
    this.description = '',
    this.level = 0,
    this.mastery = 0.0,
    this.parentId,
    this.children = const [],
  });

  factory KnowledgeNodeModel.fromJson(Map<String, dynamic> json) {
    final children = <KnowledgeNodeModel>[];
    if (json['children'] is List) {
      for (final c in json['children'] as List) {
        if (c is Map<String, dynamic>) {
          children.add(KnowledgeNodeModel.fromJson(c));
        }
      }
    }
    return KnowledgeNodeModel(
      id: json['id']?.toString() ?? '',
      domain: json['domain'] ?? json['name'] ?? '',
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      level: _parseInt(json['level'] ?? 0),
      mastery: _parseDouble(json['mastery'] ?? json['progress'] ?? 0.0),
      parentId: json['parentId']?.toString(),
      children: children,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'domain': domain,
        'name': name,
        'description': description,
        'level': level,
        'mastery': mastery,
        'parentId': parentId,
        'children': children.map((c) => c.toJson()).toList(),
      };

  int get masteryPercent => (mastery * 100).round();

  KnowledgeNodeModel copyWith({
    String? id,
    String? domain,
    String? name,
    String? description,
    int? level,
    double? mastery,
    String? parentId,
    List<KnowledgeNodeModel>? children,
  }) =>
      KnowledgeNodeModel(
        id: id ?? this.id,
        domain: domain ?? this.domain,
        name: name ?? this.name,
        description: description ?? this.description,
        level: level ?? this.level,
        mastery: mastery ?? this.mastery,
        parentId: parentId ?? this.parentId,
        children: children ?? this.children,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is KnowledgeNodeModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Daily Challenge =====
class DailyChallengeModel {
  final int? id;
  final DateTime date;
  final String question;
  final List<String> options;
  final String correctAnswer;
  final int reward;
  final bool isCompleted;
  final int? timeSpentSeconds;
  final DateTime expiresAt;

  const DailyChallengeModel({
    this.id,
    required this.date,
    required this.question,
    this.options = const [],
    required this.correctAnswer,
    this.reward = 100,
    this.isCompleted = false,
    this.timeSpentSeconds,
    required this.expiresAt,
  });

  factory DailyChallengeModel.fromJson(Map<String, dynamic> json) => DailyChallengeModel(
        id: json['id'] != null ? _parseInt(json['id']) : null,
        date: json['date'] != null ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now() : DateTime.now(),
        question: json['question'] ?? json['title'] ?? '',
        options: _parseStringList(json['options']),
        correctAnswer: json['correctAnswer'] ?? json['answer'] ?? '',
        reward: _parseInt(json['reward'] ?? 100),
        isCompleted: json['isCompleted'] ?? false,
        timeSpentSeconds: json['timeSpentSeconds'] != null ? _parseInt(json['timeSpentSeconds']) : null,
        expiresAt: json['expiresAt'] != null
            ? DateTime.tryParse(json['expiresAt'].toString()) ?? DateTime.now().add(const Duration(hours: 24))
            : DateTime.now().add(const Duration(hours: 24)),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date.toIso8601String(),
        'question': question,
        'options': options,
        'correctAnswer': correctAnswer,
        'reward': reward,
        'isCompleted': isCompleted,
        'timeSpentSeconds': timeSpentSeconds,
        'expiresAt': expiresAt.toIso8601String(),
      };

  Duration get timeRemaining => expiresAt.difference(DateTime.now());

  DailyChallengeModel copyWith({
    int? id,
    DateTime? date,
    String? question,
    List<String>? options,
    String? correctAnswer,
    int? reward,
    bool? isCompleted,
    int? timeSpentSeconds,
    DateTime? expiresAt,
  }) =>
      DailyChallengeModel(
        id: id ?? this.id,
        date: date ?? this.date,
        question: question ?? this.question,
        options: options ?? this.options,
        correctAnswer: correctAnswer ?? this.correctAnswer,
        reward: reward ?? this.reward,
        isCompleted: isCompleted ?? this.isCompleted,
        timeSpentSeconds: timeSpentSeconds ?? this.timeSpentSeconds,
        expiresAt: expiresAt ?? this.expiresAt,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is DailyChallengeModel && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// ===== Helpers =====
int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

List<String> _parseStringList(dynamic value) {
  if (value == null) return [];
  if (value is List) {
    return value.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
  }
  if (value is String) {
    return value
        .replaceAll('،', ',')
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }
  return [];
}

List<WordModel> _parseWordList(dynamic value) {
  if (value == null || value is! List) return [];
  return value
      .whereType<Map<String, dynamic>>()
      .map((e) => WordModel.fromJson(e))
      .toList();
}

List<CellModel> _parseCellList(dynamic value) {
  if (value == null || value is! List) return [];
  return value
      .whereType<Map<String, dynamic>>()
      .map((e) => CellModel.fromJson(e))
      .toList();
}
