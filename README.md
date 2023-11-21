
npm run start
curl -d '{"cmd":"time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\ngenmove B\n"}' -H "Content-Type: application/json" -X POST http://localhost:8090/api/engine

curl -d '{"cmd":"time_settings 0 5 1\nkomi 7.5\nboardsize 19\nclear_board\nplay B Q16\n"}' -H "Content-Type: application/json" -X POST http://localhost:8090/api/engine
curl -d '{"cmd":"play W R17\n"}' -H "Content-Type: application/json" -X POST http://localhost:8090/api/engine
curl -d '{"cmd":"genmove B\n"}' -H "Content-Type: application/json" -X POST http://localhost:8090/api/engine


cd seki/demo
npm run dev