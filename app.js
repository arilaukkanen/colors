var myApp = angular.module("myApp", []);

myApp.controller(
  "GameController",
  function GameController($scope, $timeout, $q) {
    var tileAmountPerColor;
    var GAME_BOARD_ROWS;
    var GAME_BOARD_COLUMNS;

    $scope.newGame = function () {
      tileAmountPerColor = 40;
      var colorNames = [1, 2, 3, 4, 5];
      GAME_BOARD_ROWS = 10;
      GAME_BOARD_COLUMNS = 20;

      tileAmountPerColor = 30;
      var colorNames = [1, 2, 3, 4, 5];
      GAME_BOARD_ROWS = 10;
      GAME_BOARD_COLUMNS = 15;

      tileAmountPerColor = 25;
      var colorNames = [1, 2, 3, 4];
      GAME_BOARD_ROWS = 10;
      GAME_BOARD_COLUMNS = 10;

      var deck = [];

      for (var i = 0; i < tileAmountPerColor; i++) {
        angular.forEach(
          colorNames,
          function (color) {
            this.push(color);
          },
          deck
        );
      }

      shuffle(deck);

      $scope.gameBoard = [];

      for (var i = 0; i < GAME_BOARD_ROWS; i++) {
        var row = [];
        for (var j = 0; j < GAME_BOARD_COLUMNS; j++) {
          row.push(new Tile(i, j, deck.shift()));
        }
        $scope.gameBoard.push(row);
      }

      $scope.score = 0;
      $scope.bonus = GAME_BOARD_COLUMNS * GAME_BOARD_ROWS * 1.5;

      $scope.clicked = false;
      $scope.gameWon = false;
      $scope.gameEnd = false;

      $scope.clickAllowed = true;

      $scope.endMessageLine1 = "WHAT THE HELL HAPPENED?!";
      $scope.endMessageLine2 = "YOU SCORED " + $scope.score + " POINTS!";
    };

    $scope.click = function (tile) {
      var row = tile.row;
      var column = tile.column;
      var color = $scope.colorOf(row, column);

      if ($scope.clickAllowed === false) {
        return;
      }

      if (color == 0) {
        return;
      }

      if ($scope.getSameColorNeighbors(row, column, color).length < 1) {
        return;
      }

      $scope.clickAllowed = false;

      $scope.removed = 0;

      $scope.removeTile(row, column);

      $timeout(function () {
        $scope.removeNeighborsContinue(row, column, color);
      }, 100);
    };

    $scope.removeNeighborsContinue = function (row, column, color) {
      $scope.removeNeighbors(row, column, color);
      $timeout(function () {
        $scope.compressGameBoardContinue();
      }, 200);
    };

    $scope.compressGameBoardContinue = function () {
      $scope.compressGameBoard();
      $scope.updateScore();
      $scope.checkGameEnd();
      $scope.clickAllowed = true;
    };

    $scope.checkGameEnd = function () {
      var colorsLeft = 0;

      for (var row = 0; row < GAME_BOARD_ROWS; row++) {
        for (var column = 0; column < GAME_BOARD_COLUMNS; column++) {
          colorsLeft += $scope.colorOf(row, column);
        }
      }

      if (colorsLeft === 0) {
        $scope.score = $scope.score + $scope.bonus;
        $scope.gameEnd = true;
        $scope.endMessage =
          "GAME WON! BONUS POINTS: " +
          $scope.bonus +
          "<br>YOU SCORED " +
          $scope.score +
          " POINTS!";
        $scope.endMessageLine1 = "YOU WON! BONUS POINTS: " + $scope.bonus;
        $scope.endMessageLine2 = "YOU SCORED " + $scope.score + " POINTS!";
        return;
      }

      for (var row = 0; row < GAME_BOARD_ROWS; row++) {
        for (var column = 0; column < GAME_BOARD_COLUMNS; column++) {
          var color = $scope.colorOf(row, column);
          if (
            color > 0 &&
            $scope.getSameColorNeighbors(row, column, color).length > 0
          ) {
            return;
          }
        }
      }
      $scope.gameEnd = true;
      $scope.endMessageLine1 = "NO MORE MOVES AVAILABLE!";
      $scope.endMessageLine2 = "YOU SCORED " + $scope.score + " POINTS!";
    };

    $scope.updateScore = function () {
      var points = $scope.pointsPerMove($scope.removed);
      var ratio = points / $scope.removed;
      $scope.score = $scope.score + points;
    };

    $scope.pointsPerMove = function (tilesRemoved) {
      var points = Math.round(
        (Math.pow(tilesRemoved, 3) + 4 * tilesRemoved) / 8
      );
      return points;
    };

    $scope.compressGameBoard = function () {
      $scope.dropFloatingTiles();
      $scope.removeEmptyColumns();
    };

    $scope.dropFloatingTiles = function () {
      for (var i = GAME_BOARD_ROWS - 1; i >= 0; i--) {
        var row = [];
        for (var j = GAME_BOARD_COLUMNS - 1; j >= 0; j--) {
          $scope.dropColoredTileIfBlack($scope.getTile(i, j));
        }
      }
    };

    $scope.removeEmptyColumns = function () {
      for (var i = 0; i < 20; i++) {
        for (var column = 0; column < GAME_BOARD_COLUMNS - 1; column++) {
          if ($scope.columnIsEmpty(column)) {
            $scope.removeColumn(column);
          }
        }
      }
    };

    $scope.removeColumn = function (column) {
      for (var row = 0; row < GAME_BOARD_ROWS; row++) {
        $scope.setTile(row, column, $scope.getTile(row, column + 1).color);
        $scope.setTile(row, column + 1, 0);
      }
    };

    $scope.columnIsEmpty = function (column) {
      var isEmpty = true;
      for (var row = 0; row < GAME_BOARD_ROWS; row++) {
        if ($scope.colorOf(row, column) > 0) {
          isEmpty = false;
        }
      }
      return isEmpty;
    };

    $scope.dropColoredTileIfBlack = function (tile) {
      if (tile.color === 0) {
        for (var i = tile.row - 1; i >= 0; i--) {
          var newColor = $scope.getTile(i, tile.column).color;
          if (newColor > 0) {
            $scope.setTile(tile.row, tile.column, newColor);

            $scope.setTile(i, tile.column, 0);

            break;
          }
        }
      }
    };

    $scope.removeNeighbors = function (row, column, _color) {
      var color = _color;

      var neighbors = $scope.getSameColorNeighbors(row, column, color);

      angular.forEach(neighbors, function (ntile) {
        $scope.removeTile(ntile.row, ntile.column);
        $scope.removeNeighbors(ntile.row, ntile.column, color);
      });
    };

    $scope.getSameColorNeighbors = function (row, column, color) {
      var list = [];

      if (row > 0 && color === $scope.colorOf(row - 1, column)) {
        list.push($scope.getTile(row - 1, column));
      }

      if (
        row < GAME_BOARD_ROWS - 1 &&
        color === $scope.colorOf(row + 1, column)
      ) {
        list.push($scope.getTile(row + 1, column));
      }
      if (column > 0 && color === $scope.colorOf(row, column - 1)) {
        list.push($scope.getTile(row, column - 1));
      }
      if (
        column < GAME_BOARD_COLUMNS - 1 &&
        color === $scope.colorOf(row, column + 1)
      ) {
        list.push($scope.getTile(row, column + 1));
      }

      return list;
    };

    $scope.colorOf = function (row, column) {
      var color = $scope.gameBoard[row][column].color;

      return color;
    };

    $scope.getTile = function (row, column) {
      return $scope.gameBoard[row][column];
    };

    $scope.removeTile = function (row, column) {
      if ($scope.gameBoard[row][column].color === 0) {
        return;
      }

      $scope.gameBoard[row][column].color = 0;
      $scope.removed++;
    };

    $scope.setTile = function (row, column, color) {
      $scope.gameBoard[row][column].color = color;
    };

    $scope.buildScoreReference = function () {
      var list = [];
      for (var i = 2; i < 20; i++) {
        var p = $scope.pointsPerMove(i);
        var obj = { tiles: i, points: p };
        list.push(obj);
      }

      $scope.scoreReference = list;
    };

    $scope.buildScoreReference();
    $scope.newGame();
  }
);

function Tile(row, column, color) {
  this.color = color;
  this.row = row;
  this.column = column;
}

Tile.prototype.toString = function () {
  return "(" + this.row + ", " + this.column + ")";
};

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}
