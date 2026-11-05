import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { stepRoute, trafficPose } from "../src/simulation/routes";
import { Activity } from "../src/simulation/activity";
import { animalModel } from "../src/simulation/animals";
test("blocked routes wait and change target without teleporting through obstacles", () => {
  const s = { x: 0, z: 0, target: 1, wait: 0, stuck: 0 },
    route = [
      { x: 0, z: 0 },
      { x: 10, z: 0 },
      { x: 0, z: 10 },
    ];
  const visited=new Set<number>();
  for(let i=0;i<60;i++){stepRoute(s,route,.1,1,()=>true);visited.add(s.target);}
  assert.equal(s.x, 0);
  assert.equal(s.z, 0);
  assert.ok(visited.size >= 2);
});
test("town simulation is bounded and uses four distinct friendly animal models", () => {
  const a = new Activity(new T.Scene(), 70);
  assert.equal(a.agents.length, 10);
  assert.deepEqual(
    a.agents.filter((x) => x.animal).map((x) => x.species),
    ["dog", "cat", "duck", "horse"],
  );
  for (const name of ["dog", "cat", "duck", "horse"] as const) {
    const model = animalModel(name);
    assert.equal(model.group.userData.species, name);
    assert.ok(new T.Box3().setFromObject(model.group).max.y > 0);
  }
  a.dispose();
});
test("greetings pause residents and traffic respects headway", () => {
  const a = new Activity(new T.Scene(), 70),
    agent = a.agents[0];
  const p = { x: agent.state.x + 1, y: 0, z: agent.state.z, yaw: 0 };
  assert.match(a.use(p, []) || "", /neighbour/);
  const before = { x: agent.state.x, z: agent.state.z };
  a.update(0.1, { x: 100, y: 0, z: 0 }, { forward: 0, right: 0 }, []);
  assert.equal(agent.state.x, before.x);
  a.progress = [10, 14];
  a.traffic.forEach((m, i) => {
    const p = trafficPose(a.progress[i]);
    m.position.set(p.x, 0, p.z);
    m.rotation.y = p.yaw;
  });
  a.update(1 / 60, { x: 100, y: 0, z: 100 }, { forward: 0, right: 0 }, []);
  assert.equal(a.progress[0], 10);
  assert.ok(a.progress[1] > 14);
  a.dispose();
});
