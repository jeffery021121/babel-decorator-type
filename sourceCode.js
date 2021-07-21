@dec1('dec1')
class A {
  @dec2
  fn1() { }

  @dec3('dec3', 1, { aa: 1, bb: 'bb' }, [1, 2, 3, { aaa: 1 }])
  fn2() { }
}